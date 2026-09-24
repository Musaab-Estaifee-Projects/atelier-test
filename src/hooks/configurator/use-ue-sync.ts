"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { captureCamerasHighResOnUe } from "@/lib/configurator/apply-ue";
import { patchDraft } from "@/lib/configurator/storage";
import {
  invalidateUeSyncCache,
  syncDraftToUe,
  UE_SYNC_FAIL,
  type UeSyncResult,
} from "@/lib/configurator/sync-to-ue";
import type { UeInteractionPayload } from "@/lib/stream-pixel/ue-protocol";
import type { ConfiguratorSession } from "@/types/configurator";

type SyncOpts = {
  force?: boolean;
  skipLoadLevel?: boolean;
  skipViewRestore?: boolean;
  requireLoadCustomization?: boolean;
};

type Args = {
  session: ConfiguratorSession | null;
  layoutCode: string;
  viewOnly: boolean;
  send: (payload: UeInteractionPayload) => boolean;
  streamLoading: boolean;
  selectionsHydrated: boolean;
  designCode: string | null;
  designCodeRef: React.RefObject<string | null>;
  returningVisitRef: React.RefObject<boolean>;
  pixelStreamingRef: React.RefObject<unknown>;
  streamReadyRef: React.RefObject<boolean>;
  videoContainerRef: React.RefObject<HTMLDivElement | null>;
  prepareViewForSync: () => { zone: string | null; camera: string | null };
  storage: {
    streamProjectId: string;
    projectId: string;
    layoutCode: string;
    apartmentId: string | null;
  };
};

/**
 * Keeps Unreal in step with the configurator: LoadLevel → optional
 * LoadCustomization → URL view, on boot, reconnect, and layout change.
 */
export function useUeSync({
  session,
  layoutCode,
  viewOnly,
  send,
  streamLoading,
  selectionsHydrated,
  designCode,
  designCodeRef,
  returningVisitRef,
  pixelStreamingRef,
  streamReadyRef,
  videoContainerRef,
  prepareViewForSync,
  storage,
}: Args) {
  const [sceneReady, setSceneReady] = useState(false);
  const [ueSyncStatus, setUeSyncStatus] = useState<string | null>(null);
  const [ueSyncError, setUeSyncError] = useState<string | null>(null);
  const appliedReadyRef = useRef(false);
  const highResPipelineRef = useRef(false);
  const loadedLevelRef = useRef<string | null>(null);

  const isUeReady = useCallback(() => {
    const ps = pixelStreamingRef.current as {
      emitUIInteraction?: (p: Record<string, unknown>) => boolean | void;
    } | null;
    if (!streamReadyRef.current || !ps?.emitUIInteraction) return false;
    const video = videoContainerRef.current?.querySelector(
      "video",
    ) as HTMLVideoElement | null;
    return Boolean(video && video.readyState >= 2);
  }, [pixelStreamingRef, streamReadyRef, videoContainerRef]);

  /** Mark the live scene as matching `layout` after an out-of-band restore. */
  const markSceneReady = useCallback((layout: string) => {
    appliedReadyRef.current = true;
    loadedLevelRef.current = layout;
    setSceneReady(true);
    setUeSyncError(null);
    setUeSyncStatus(null);
  }, []);

  const runUeSync = useCallback(
    async (opts?: SyncOpts): Promise<UeSyncResult> => {
      if (!session) return { ...UE_SYNC_FAIL };

      const code = designCodeRef.current;
      setUeSyncError(null);
      if (returningVisitRef.current && code && !opts?.skipLoadLevel) {
        setUeSyncStatus("Restoring your saved finishes…");
      }

      const { zone, camera } = prepareViewForSync();
      const levelName = session.layoutCode || layoutCode;

      try {
        const result = await syncDraftToUe({
          send,
          isUeReady,
          layoutCode: levelName,
          designCode: code,
          returningVisit: returningVisitRef.current || viewOnly,
          zone,
          camera,
          skipLoadLevel: opts?.skipLoadLevel,
          skipViewRestore: opts?.skipViewRestore,
          requireLoadCustomization: opts?.requireLoadCustomization || viewOnly,
          force: opts?.force,
          onProgress: opts?.skipLoadLevel
            ? undefined
            : (msg) => setUeSyncStatus(msg),
        });

        if (result.ok) {
          appliedReadyRef.current = true;
          loadedLevelRef.current = levelName;
          setSceneReady(true);
          setUeSyncStatus(null);
          setUeSyncError(null);
        } else if (!appliedReadyRef.current) {
          setSceneReady(false);
          setUeSyncStatus(null);
          setUeSyncError("Waiting for the 3D session to be ready…");
        } else {
          setUeSyncStatus(null);
          setUeSyncError("Could not restore finishes. Retry when ready.");
        }
        return result;
      } catch {
        setUeSyncStatus(null);
        if (!appliedReadyRef.current) setSceneReady(false);
        setUeSyncError("Sync failed. Retry when the stream is ready.");
        return { ...UE_SYNC_FAIL };
      }
    },
    [
      session,
      viewOnly,
      layoutCode,
      send,
      isUeReady,
      prepareViewForSync,
      designCodeRef,
      returningVisitRef,
    ],
  );

  const runUeSyncRef = useRef(runUeSync);
  useEffect(() => {
    runUeSyncRef.current = runUeSync;
  }, [runUeSync]);

  const retrySync = useCallback(() => {
    setUeSyncError(null);
    void runUeSyncRef.current({ force: true });
  }, []);

  const runLoadThenCaptureHighRes = useCallback(async () => {
    const code = designCodeRef.current;
    if (!code) return false;
    highResPipelineRef.current = true;
    try {
      const streamAlreadyOpen = isUeReady() && appliedReadyRef.current;
      if (!streamAlreadyOpen) {
        returningVisitRef.current = true;
        const synced = await runUeSyncRef.current({
          force: true,
          requireLoadCustomization: true,
          skipViewRestore: true,
        });
        if (!synced.loadLevel || !synced.loadCustomization) {
          console.warn(
            "[UE] CaptureCamerasHighRes skipped — LoadLevel/LoadCustomization did not succeed",
            synced,
          );
          return false;
        }
      }
      const sent = await captureCamerasHighResOnUe(send, code);
      if (sent) {
        patchDraft(storage, { highResCaptureSent: true });
      } else {
        console.warn("[UE] CaptureCamerasHighRes emit was not accepted");
      }
      return sent;
    } finally {
      highResPipelineRef.current = false;
    }
  }, [designCodeRef, isUeReady, returningVisitRef, send, storage]);

  // Initial sync once the stream, catalog and selections are ready.
  useEffect(() => {
    if (streamLoading || !session || !selectionsHydrated) return;
    if (highResPipelineRef.current || appliedReadyRef.current) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled || highResPipelineRef.current) return;
      void runUeSyncRef.current({ force: !appliedReadyRef.current });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [streamLoading, session, selectionsHydrated, designCode]);

  // Stream reconnecting → the scene must be restored again.
  useEffect(() => {
    if (!streamLoading) return;
    appliedReadyRef.current = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reacts to external stream state
    setSceneReady(false);
    invalidateUeSyncCache();
  }, [streamLoading]);

  // URL layout_code change → LoadLevel (customization restored via LoadCustomization)
  useEffect(() => {
    if (streamLoading || !session || !selectionsHydrated) return;
    const level = session.layoutCode || layoutCode;
    if (!level) return;

    if (loadedLevelRef.current == null) {
      loadedLevelRef.current = level;
      return;
    }
    if (loadedLevelRef.current === level) return;

    loadedLevelRef.current = level;
    void runUeSyncRef.current({ force: true });
  }, [layoutCode, streamLoading, session, selectionsHydrated]);

  return {
    sceneReady,
    ueSyncStatus,
    setUeSyncStatus,
    ueSyncError,
    setUeSyncError,
    appliedReadyRef,
    isUeReady,
    markSceneReady,
    runUeSync,
    retrySync,
    runLoadThenCaptureHighRes,
  };
}
