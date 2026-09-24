"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { captureCamerasOnUe } from "@/lib/configurator/apply-ue";
import { buildApiSelections } from "@/lib/configurator/api-selections";
import {
  loadDraft,
  newIdempotencyKey,
  patchDraft,
} from "@/lib/configurator/storage";
import {
  failedRenderCameras,
  rendersInProgress,
  roomsFromRenders,
  stillIndexFor,
  stillsFromRenders,
} from "@/lib/configurator/renders-view";
import { apiErrorMessage } from "@/lib/api-error";
import {
  getRenders,
  listRenderCameras,
  parseRenderTotalAmount,
  prepareRenders,
  retryRenders,
  type GetRendersData,
} from "@/services/renders.service";
import type { ConfiguratorSession, SelectionMap } from "@/types/configurator";
import type { LightboxStill } from "@/components/configurator/final-design/final-design-viewer";
import type { UeInteractionPayload } from "@/lib/stream-pixel/ue-protocol";

const MAX_AUTO_RETRIES = 3;
const DEFAULT_POLL_MS = 3000;

function renderCameraKey(cam: { camera_zone_id: string; camera_id: string }) {
  return `${cam.camera_zone_id}:${cam.camera_id}`;
}

function assetPath(url: string | null | undefined) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url.split("?")[0] ?? "";
  }
}

function stabilizeCompletedUrls(
  prev: GetRendersData | null,
  next: GetRendersData,
): GetRendersData {
  const prevCams = listRenderCameras(prev);
  if (!prevCams.length) return next;
  const previous = new Map(prevCams.map((cam) => [renderCameraKey(cam), cam]));
  return {
    ...next,
    camera_zones: next.camera_zones.map((zone) => ({
      ...zone,
      cameras: zone.cameras.map((cam) => {
        const old = previous.get(
          renderCameraKey({
            camera_zone_id: zone.camera_zone_id,
            camera_id: cam.camera_id,
          }),
        );
        if (
          cam.status === "completed" &&
          cam.render_s3_url &&
          old?.status === "completed" &&
          old.render_s3_url &&
          assetPath(old.render_s3_url) === assetPath(cam.render_s3_url)
        ) {
          return { ...cam, render_s3_url: old.render_s3_url };
        }
        return cam;
      }),
    })),
  };
}

type SendFn = (payload: UeInteractionPayload) => boolean;

type Args = {
  enabled: boolean;
  send: SendFn;
  streamProjectId: string;
  backendProjectId: string;
  layoutCode: string;
  apartmentId?: string | null;
  designCode: string | null;
  session: ConfiguratorSession | null;
  customMap: SelectionMap;
};

export function useRenderJob({
  enabled,
  send,
  streamProjectId,
  backendProjectId,
  layoutCode,
  apartmentId,
  designCode,
  session,
  customMap,
}: Args) {
  const [active, setActive] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [data, setData] = useState<GetRendersData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const retryRoundsRef = useRef(0);
  const retryInFlightRef = useRef(false);
  const lastRetryAtRef = useRef(0);
  const pollTimerRef = useRef<number | null>(null);
  const pollOnceRef = useRef<() => Promise<void>>(async () => undefined);
  const activeRef = useRef(false);
  const enabledRef = useRef(enabled);
  const startInFlightRef = useRef(false);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const storageArgs = useMemo(
    () => ({
      streamProjectId,
      projectId: backendProjectId,
      layoutCode,
      apartmentId,
    }),
    [apartmentId, backendProjectId, layoutCode, streamProjectId],
  );

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current != null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const retryKeyFromDraft = useCallback(() => {
    const draft = loadDraft(
      streamProjectId,
      backendProjectId,
      layoutCode,
      apartmentId,
    );
    const retryKey =
      draft?.prepareIdempotencyKey ||
      draft?.retryIdempotencyKey ||
      newIdempotencyKey();
    patchDraft(storageArgs, {
      prepareIdempotencyKey: retryKey,
      retryIdempotencyKey: retryKey,
    });
    return retryKey;
  }, [apartmentId, backendProjectId, layoutCode, storageArgs, streamProjectId]);

  const pollOnce = useCallback(async () => {
    if (!designCode || !activeRef.current || !enabledRef.current) return;
    try {
      const next = await getRenders(designCode);
      if (!activeRef.current || !enabledRef.current) {
        stopPolling();
        return;
      }
      setData((prev) => stabilizeCompletedUrls(prev, next));
      setError(null);

      if (next.is_all_rendered || next.is_terminal) {
        stopPolling();
        return;
      }

      const failed = failedRenderCameras(next);
      const canAutoRetry =
        failed.length &&
        retryRoundsRef.current < MAX_AUTO_RETRIES &&
        !retryInFlightRef.current &&
        Date.now() - lastRetryAtRef.current > 8000 &&
        enabledRef.current &&
        activeRef.current;
      if (canAutoRetry) {
        retryInFlightRef.current = true;
        retryRoundsRef.current += 1;
        lastRetryAtRef.current = Date.now();
        try {
          captureCamerasOnUe(
            send,
            designCode,
            failed.map((c) => c.camera_id),
          );
          await retryRenders(
            designCode,
            failed.map((c) => ({
              camera_zone_id: c.camera_zone_id,
              camera_id: c.camera_id,
            })),
            retryKeyFromDraft(),
          );
        } catch (err) {
          setError(apiErrorMessage(err, "Render retry failed"));
        } finally {
          retryInFlightRef.current = false;
        }
      }

      if (!activeRef.current || !enabledRef.current) {
        stopPolling();
        return;
      }
      stopPolling();
      pollTimerRef.current = window.setTimeout(() => {
        void pollOnceRef.current();
      }, DEFAULT_POLL_MS);
    } catch (err) {
      if (!activeRef.current || !enabledRef.current) {
        stopPolling();
        return;
      }
      setError(apiErrorMessage(err, "Failed to load render progress"));
      stopPolling();
      pollTimerRef.current = window.setTimeout(() => {
        void pollOnceRef.current();
      }, DEFAULT_POLL_MS);
    }
  }, [designCode, retryKeyFromDraft, send, stopPolling]);

  useEffect(() => {
    pollOnceRef.current = pollOnce;
  }, [pollOnce]);

  const startPolling = useCallback(() => {
    stopPolling();
    void pollOnce();
  }, [pollOnce, stopPolling]);

  const start = useCallback(async () => {
    if (!enabledRef.current || startInFlightRef.current) return false;
    if (!designCode || !session) {
      setError("Design is not ready yet.");
      return false;
    }

    const draft = loadDraft(
      streamProjectId,
      backendProjectId,
      layoutCode,
      apartmentId,
    );
    const summaryToken = draft?.summaryToken;
    if (!summaryToken) {
      setError("Quotation summary is not ready yet.");
      return false;
    }

    startInFlightRef.current = true;
    setError(null);
    setPreparing(true);
    retryRoundsRef.current = 0;
    lastRetryAtRef.current = 0;

    const idempotencyKey = draft?.prepareIdempotencyKey || newIdempotencyKey();
    patchDraft(storageArgs, {
      prepareIdempotencyKey: idempotencyKey,
      retryIdempotencyKey: idempotencyKey,
    });

    try {
      await prepareRenders(
        designCode,
        {
          selection_revision: 0,
          summary_token: summaryToken,
          selections: buildApiSelections(session, customMap),
        },
        idempotencyKey,
      );

      setActive(true);
      activeRef.current = true;
      startPolling();
      return true;
    } catch (err) {
      setActive(false);
      activeRef.current = false;
      setError(apiErrorMessage(err, "Failed to prepare renders"));
      return false;
    } finally {
      startInFlightRef.current = false;
      setPreparing(false);
    }
  }, [
    apartmentId,
    backendProjectId,
    customMap,
    designCode,
    layoutCode,
    session,
    startPolling,
    storageArgs,
    streamProjectId,
  ]);

  const resume = useCallback(() => {
    if (!designCode) return;
    enabledRef.current = true;
    setActive(true);
    activeRef.current = true;
    startPolling();
  }, [designCode, startPolling]);

  const retryFailed = useCallback(
    async (cameras?: { camera_zone_id: string; camera_id: string }[]) => {
      if (!enabledRef.current || !designCode) return;
      const targets =
        cameras ??
        failedRenderCameras(data).map((c) => ({
          camera_zone_id: c.camera_zone_id,
          camera_id: c.camera_id,
        }));
      if (!targets.length) return;
      captureCamerasOnUe(
        send,
        designCode,
        targets.map((c) => c.camera_id),
      );
      const retryKey = retryKeyFromDraft();
      try {
        await retryRenders(designCode, targets, retryKey);
        startPolling();
      } catch (err) {
        setError(apiErrorMessage(err, "Retry failed"));
      }
    },
    [data, designCode, retryKeyFromDraft, send, startPolling],
  );

  const retryRoom = useCallback(
    (zoneId: string) => {
      const zone = data?.camera_zones.find((z) => z.camera_zone_id === zoneId);
      const cams = (zone?.cameras ?? [])
        .filter((c) => c.is_failed || c.status === "failed")
        .map((c) => ({
          camera_zone_id: zoneId,
          camera_id: c.camera_id,
        }));
      void retryFailed(cams);
    },
    [data, retryFailed],
  );

  const stop = useCallback(() => {
    setActive(false);
    activeRef.current = false;
    stopPolling();
  }, [stopPolling]);

  const reset = useCallback(() => {
    setActive(false);
    activeRef.current = false;
    setPreparing(false);
    setData(null);
    setError(null);
    setLightboxIndex(null);
    stopPolling();
  }, [stopPolling]);

  useEffect(() => {
    if (!enabled || !active) stopPolling();
  }, [active, enabled, stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const rooms = useMemo(() => roomsFromRenders(data, session), [session, data]);

  const stills: LightboxStill[] = useMemo(
    () => stillsFromRenders(data, session),
    [data, session],
  );

  const openViewer = useCallback(
    (zoneId: string, cameraName?: string) => {
      const index = stillIndexFor(stills, zoneId, cameraName);
      if (index >= 0) setLightboxIndex(index);
    },
    [stills],
  );

  const confirmDisabled =
    !data?.is_all_rendered ||
    rendersInProgress(data) ||
    failedRenderCameras(data).length > 0;

  return {
    active,
    preparing,
    data,
    rooms,
    stills,
    lightboxIndex,
    setLightboxIndex,
    error,
    allReady: Boolean(data?.is_all_rendered),
    totalAmount: parseRenderTotalAmount(data?.total_amount),
    confirmDisabled,
    start,
    resume,
    stop,
    reset,
    retryRoom,
    retryFailed,
    openViewer,
    closeViewer: () => setLightboxIndex(null),
  };
}
