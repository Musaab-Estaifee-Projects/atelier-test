"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  captureCamerasHighResOnUe,
  captureCamerasOnUe,
} from "@/lib/configurator/apply-ue";
import { buildApiSelections } from "@/lib/configurator/api-selections";
import {
  loadDraft,
  newIdempotencyKey,
  patchDraft,
} from "@/lib/configurator/storage";
import {
  getRenders,
  prepareRenders,
  retryRenders,
  type GetRendersData,
  type RenderCameraStatus,
} from "@/services/renders.service";
import type {
  ConfiguratorSession,
  RoomRenderCard,
  SelectionMap,
} from "@/types/configurator";
import type { LightboxStill } from "@/components/configurator/final-design/final-design-viewer";
import type { UeInteractionPayload } from "@/lib/stream-pixel/ue-protocol";
import { isAxiosError } from "axios";

function apiErrorMessage(err: unknown, fallback: string) {
  if (isAxiosError(err)) {
    const body = err.response?.data as { message?: string } | undefined;
    return body?.message || err.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
}

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
  if (!prev?.cameras.length) return next;
  const previous = new Map(
    prev.cameras.map((cam) => [renderCameraKey(cam), cam]),
  );
  return {
    ...next,
    cameras: next.cameras.map((cam) => {
      const old = previous.get(renderCameraKey(cam));
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
  };
}

type SendFn = (payload: UeInteractionPayload) => boolean;

function failedCameras(data: GetRendersData | null): RenderCameraStatus[] {
  if (!data) return [];
  return data.cameras.filter(
    (cam) => cam.is_failed || cam.status === "failed",
  );
}

function inProgress(data: GetRendersData | null): boolean {
  if (!data) return true;
  if (data.is_all_rendered) return false;
  return data.cameras.some(
    (cam) =>
      !cam.is_failed &&
      cam.status !== "completed" &&
      cam.status !== "failed",
  );
}

function roomsFromRenders(
  session: ConfiguratorSession | null,
  data: GetRendersData | null,
): RoomRenderCard[] {
  if (!data) return [];
  const zones = session?.zones?.length
    ? session.zones
    : Array.from(
        new Set(data.cameras.map((c) => c.camera_zone_id)),
      ).map((id) => ({
        id,
        label: id,
        ueZone: id,
        cameras: [],
      }));

  const rooms: RoomRenderCard[] = [];
  for (const zone of zones) {
    const cams = data.cameras.filter((c) => c.camera_zone_id === zone.id);
    if (!cams.length) continue;
    const stills = cams.map((cam) => ({
      cameraName: cam.camera_id,
      imageUrl: cam.render_s3_url ?? undefined,
    }));
    const allDone = cams.every(
      (c) => c.status === "completed" && c.render_s3_url,
    );
    const anyFailed = cams.some((c) => c.is_failed || c.status === "failed");
    const hero = cams.find((c) => c.render_s3_url) ?? cams[0];
    rooms.push({
      zoneId: zone.id,
      label: zone.label,
      ueZone: zone.ueZone || zone.id,
      heroCameraName: hero?.camera_id ?? zone.id,
      heroCameraIndex: 0,
      status: allDone ? "completed" : anyFailed ? "error" : "rendering",
      imageUrl: hero?.render_s3_url ?? undefined,
      attempt: Math.max(...cams.map((c) => c.attempt_number || 1), 1),
      stills,
    });
  }
  return rooms;
}

type Args = {
  enabled: boolean;
  send: SendFn;
  mockUe: boolean;
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
  mockUe,
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
  const activeRef = useRef(false);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  activeRef.current = active;

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

      if (next.is_all_rendered) {
        stopPolling();
        return;
      }

      const failed = failedCameras(next);
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
          const names = failed.map((c) => c.camera_id);
          captureCamerasOnUe(send, designCode, names, { mockLog: mockUe });
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
          await retryRenders(
            designCode,
            failed.map((c) => ({
              camera_zone_id: c.camera_zone_id,
              camera_id: c.camera_id,
            })),
            retryKey,
          );
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Render retry failed";
          setError(message);
        } finally {
          retryInFlightRef.current = false;
        }
      }

      if (!activeRef.current || !enabledRef.current) {
        stopPolling();
        return;
      }
      const delay = next.poll_after_ms || DEFAULT_POLL_MS;
      stopPolling();
      pollTimerRef.current = window.setTimeout(() => {
        void pollOnce();
      }, delay);
    } catch (err) {
      if (!activeRef.current || !enabledRef.current) {
        stopPolling();
        return;
      }
      const message =
        err instanceof Error ? err.message : "Failed to load render progress";
      setError(message);
      stopPolling();
      pollTimerRef.current = window.setTimeout(() => {
        void pollOnce();
      }, DEFAULT_POLL_MS);
    }
  }, [
    apartmentId,
    backendProjectId,
    designCode,
    layoutCode,
    mockUe,
    send,
    stopPolling,
    storageArgs,
    streamProjectId,
  ]);

  const startPolling = useCallback(() => {
    stopPolling();
    void pollOnce();
  }, [pollOnce, stopPolling]);

  const start = useCallback(async () => {
    if (!enabledRef.current) return false;
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
      captureCamerasHighResOnUe(send, designCode, { mockLog: mockUe });
      patchDraft(storageArgs, { highResCaptureSent: true });
      startPolling();
      return true;
    } catch (err) {
      setActive(false);
      activeRef.current = false;
      setError(apiErrorMessage(err, "Failed to prepare renders"));
      return false;
    } finally {
      setPreparing(false);
    }
  }, [
    apartmentId,
    backendProjectId,
    customMap,
    designCode,
    layoutCode,
    mockUe,
    send,
    session,
    startPolling,
    storageArgs,
    streamProjectId,
  ]);

  const resume = useCallback(() => {
    if (!enabledRef.current || !designCode) return;
    setActive(true);
    activeRef.current = true;
    startPolling();
  }, [designCode, startPolling]);

  const retryFailed = useCallback(
    async (cameras?: { camera_zone_id: string; camera_id: string }[]) => {
      if (!enabledRef.current || !designCode) return;
      const targets =
        cameras ??
        failedCameras(data).map((c) => ({
          camera_zone_id: c.camera_zone_id,
          camera_id: c.camera_id,
        }));
      if (!targets.length) return;
      captureCamerasOnUe(
        send,
        designCode,
        targets.map((c) => c.camera_id),
        { mockLog: mockUe },
      );
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
      try {
        await retryRenders(designCode, targets, retryKey);
        startPolling();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Retry failed");
      }
    },
    [
      apartmentId,
      backendProjectId,
      data,
      designCode,
      layoutCode,
      mockUe,
      send,
      startPolling,
      storageArgs,
      streamProjectId,
    ],
  );

  const retryRoom = useCallback(
    (zoneId: string) => {
      const cams = (data?.cameras ?? [])
        .filter((c) => c.camera_zone_id === zoneId)
        .filter((c) => c.is_failed || c.status === "failed")
        .map((c) => ({
          camera_zone_id: c.camera_zone_id,
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

  const rooms = useMemo(
    () => roomsFromRenders(session, data),
    [session, data],
  );

  const stills: LightboxStill[] = useMemo(
    () =>
      (data?.cameras ?? [])
        .filter((c) => c.render_s3_url)
        .map((c) => {
          const zone = session?.zones.find((z) => z.id === c.camera_zone_id);
          const cameraLabel = session?.slotLabels[c.camera_id] ?? c.camera_id;
          return {
            cameraName: c.camera_id,
            cameraLabel,
            zoneId: c.camera_zone_id,
            zoneName: zone?.label ?? c.camera_zone_id,
            label: zone ? `${zone.label} - ${cameraLabel}` : cameraLabel,
            imageUrl: c.render_s3_url as string,
          };
        }),
    [data, session],
  );

  const openViewer = useCallback(
    (zoneId: string, cameraName?: string) => {
      const index = stills.findIndex(
        (s) =>
          s.zoneId === zoneId &&
          (!cameraName || s.cameraName === cameraName),
      );
      if (index >= 0) setLightboxIndex(index);
    },
    [stills],
  );

  const confirmDisabled =
    !data?.is_all_rendered ||
    inProgress(data) ||
    failedCameras(data).length > 0;

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
