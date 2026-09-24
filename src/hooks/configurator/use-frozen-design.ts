"use client";

import { useCallback, useEffect, useState } from "react";
import {
  restoreKeepSourceOnUe,
  saveKeepCustomizationToUe,
} from "@/lib/configurator/apply-ue";
import { customMapToStored } from "@/lib/configurator/api-selections";
import { createReplacementDesign } from "@/lib/configurator/ensure-design";
import {
  clearDraft,
  loadDraft,
  markFreshStartIntent,
} from "@/lib/configurator/storage";
import { invalidateUeSyncCache } from "@/lib/configurator/sync-to-ue";
import { locationWithoutRenders } from "@/lib/configurator/url-params";
import type { UeInteractionPayload } from "@/lib/stream-pixel/ue-protocol";
import type {
  ConfiguratorSession,
  SelectionMap,
  ShareableConfiguratorParams,
} from "@/types/configurator";

export type FrozenDesignPending = "new" | "keep" | null;

type Args = {
  session: ConfiguratorSession | null;
  catalogApiProjectId: string | null;
  projectId: string;
  layoutCode: string;
  apartmentId: string | null;
  rendersParam: boolean;
  selectionMap: SelectionMap;
  resetSelections: () => void;
  designCodeRef: React.RefObject<string | null>;
  returningVisitRef: React.RefObject<boolean>;
  resumedRendersRef: React.RefObject<boolean>;
  setDesignCode: (code: string) => void;
  send: (payload: UeInteractionPayload) => boolean;
  isUeReady: () => boolean;
  markSceneReady: (layout: string) => void;
  renderJob: { reset: () => void; resume: () => void };
  runLoadThenCaptureHighRes: () => Promise<boolean>;
  setParams: (
    patch: Partial<ShareableConfiguratorParams>,
    options?: { replace?: boolean },
  ) => void;
  closeOverlays: () => void;
  allowNavigation: () => void;
};

/**
 * 409 "design frozen" recovery: continue rendering, keep customization on a
 * replacement design, start new, or leave to projects.
 */
export function useFrozenDesign({
  session,
  catalogApiProjectId,
  projectId,
  layoutCode,
  apartmentId,
  rendersParam,
  selectionMap,
  resetSelections,
  designCodeRef,
  returningVisitRef,
  resumedRendersRef,
  setDesignCode,
  send,
  isUeReady,
  markSceneReady,
  renderJob,
  runLoadThenCaptureHighRes,
  setParams,
  closeOverlays,
  allowNavigation,
}: Args) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<FrozenDesignPending>(null);
  const [fromRenders, setFromRenders] = useState(false);
  const [keepFailedOpen, setKeepFailedOpen] = useState(false);
  const [keepStreamWaitingOpen, setKeepStreamWaitingOpen] = useState(false);

  const openFrozen = useCallback(() => {
    setFromRenders(rendersParam);
    setOpen(true);
  }, [rendersParam]);

  const handleContinueRendering = useCallback(() => {
    setOpen(false);
    resumedRendersRef.current = true;
    returningVisitRef.current = true;
    if (!rendersParam) {
      setParams({ renders: true }, { replace: true });
    }
    renderJob.resume();
    void runLoadThenCaptureHighRes();
  }, [
    rendersParam,
    renderJob,
    resumedRendersRef,
    returningVisitRef,
    runLoadThenCaptureHighRes,
    setParams,
  ]);

  const reloadWithoutRenders = useCallback(() => {
    allowNavigation();
    window.location.replace(locationWithoutRenders());
  }, [allowNavigation]);

  const handleStartNew = useCallback(async () => {
    if (!session || !catalogApiProjectId) return;
    setPending("new");
    try {
      resumedRendersRef.current = true;
      renderJob.reset();
      resetSelections();

      const layout = session.layoutCode || layoutCode;
      markFreshStartIntent(projectId, catalogApiProjectId, layout, apartmentId);
      clearDraft(projectId, catalogApiProjectId, layout, apartmentId);
      returningVisitRef.current = false;
      designCodeRef.current = "";
      invalidateUeSyncCache();
      reloadWithoutRenders();
    } catch (err) {
      console.warn("[design] replacement failed", err);
      setPending(null);
    }
  }, [
    apartmentId,
    catalogApiProjectId,
    designCodeRef,
    layoutCode,
    projectId,
    reloadWithoutRenders,
    renderJob,
    resetSelections,
    resumedRendersRef,
    returningVisitRef,
    session,
  ]);

  const handleKeep = useCallback(async () => {
    if (!session || !catalogApiProjectId) return;
    const source = designCodeRef.current?.trim();
    if (!source) return;
    setPending("keep");

    const failKeep = () => {
      setOpen(false);
      setPending(null);
      setKeepFailedOpen(true);
      window.setTimeout(() => setKeepStreamWaitingOpen(false), 0);
    };

    try {
      resumedRendersRef.current = true;
      renderJob.reset();
      if (rendersParam) setKeepStreamWaitingOpen(true);

      const layout = session.layoutCode || layoutCode;
      const restored = await restoreKeepSourceOnUe({
        send,
        isUeReady,
        layoutCode: layout,
        sourceDesignCode: source,
        onWaiting: () => setKeepStreamWaitingOpen(true),
      });
      if (
        !restored.streamReady ||
        !restored.loadLevel ||
        !restored.loadCustomization
      ) {
        console.warn("[design] keep source restore failed", restored);
        failKeep();
        return;
      }

      markSceneReady(layout);

      const fromMap = customMapToStored(session, selectionMap);
      const fromDraft =
        loadDraft(projectId, catalogApiProjectId, layout, apartmentId)
          ?.selections ?? [];

      const nextCode = await createReplacementDesign({
        streamProjectId: projectId,
        backendProjectId: catalogApiProjectId,
        layoutCode: layout,
        apartmentId,
        sourceDesignCode: source,
        selections: fromMap.length ? fromMap : fromDraft,
      });
      if (!nextCode) {
        failKeep();
        return;
      }

      const saved = await saveKeepCustomizationToUe(send, nextCode, {
        isUeReady,
        onWaiting: () => setKeepStreamWaitingOpen(true),
      });
      if (!saved) {
        failKeep();
        return;
      }

      returningVisitRef.current = true;
      markSceneReady(layout);
      setDesignCode(nextCode);
      closeOverlays();
      setFromRenders(false);
      renderJob.reset();
      if (rendersParam) {
        setKeepStreamWaitingOpen(true);
        setParams({ renders: false }, { replace: true });
      }
      setOpen(false);
      if (!rendersParam) {
        setPending(null);
        setKeepStreamWaitingOpen(false);
      }
    } catch (err) {
      console.warn("[design] keep customization failed", err);
      failKeep();
    }
  }, [
    apartmentId,
    catalogApiProjectId,
    closeOverlays,
    designCodeRef,
    isUeReady,
    layoutCode,
    markSceneReady,
    projectId,
    renderJob,
    rendersParam,
    resumedRendersRef,
    returningVisitRef,
    selectionMap,
    send,
    session,
    setDesignCode,
    setParams,
  ]);

  // Keep from the renders screen finishes once `renders` leaves the URL.
  useEffect(() => {
    if (pending !== "keep" || open || rendersParam) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- waits for URL update
    setPending(null);
    setKeepStreamWaitingOpen(false);
  }, [open, pending, rendersParam]);

  return {
    open,
    pending,
    fromRenders,
    keepFailedOpen,
    keepStreamWaitingOpen,
    openFrozen,
    handleContinueRendering,
    handleStartNew,
    handleKeep,
  };
}
