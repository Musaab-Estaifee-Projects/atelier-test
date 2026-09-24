"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveCustomizationToUe } from "@/lib/configurator/apply-ue";
import { hasDraftForLayout } from "@/lib/configurator/storage";
import { getValidJourneyToken } from "@/lib/journey";
import { cloneQuotationDesign } from "@/lib/quotation/clone-design";
import {
  clearQuotationResume,
  patchQuotationResume,
  readQuotationResume,
} from "@/lib/quotation/resume-intent";
import { quotationPath } from "@/lib/quotation/share-url";
import type { DesignSummaryData } from "@/services/post-design-summary.service";
import type { UeInteractionPayload } from "@/lib/stream-pixel/ue-protocol";
import type {
  ConfiguratorSession,
  ShareableConfiguratorParams,
} from "@/types/configurator";

type Args = {
  projectId: string;
  catalogApiProjectId: string | null;
  layoutCode: string;
  apartmentId: string | null;
  viewOnly: boolean;
  session: ConfiguratorSession | null;
  sceneReady: boolean;
  journeyReady: boolean | null;
  setJourneyReady: (ready: boolean) => void;
  pendingViewEditRef: React.RefObject<boolean>;
  designCodeRef: React.RefObject<string | null>;
  returningVisitRef: React.RefObject<boolean>;
  appliedReadyRef: React.RefObject<boolean>;
  setDesignCode: (code: string) => void;
  send: (payload: UeInteractionPayload) => boolean;
  setParams: (
    patch: Partial<ShareableConfiguratorParams>,
    options?: { replace?: boolean },
  ) => void;
  hydrateSelectionsFromStorage: () => void;
  setUeSyncStatus: (status: string | null) => void;
  setUeSyncError: (error: string | null) => void;
  allowNavigation: () => void;
};

/**
 * Quotation → configurator hand-off: view-only "Edit" / "Cancel" in the dock,
 * the replace-customization guard, and auto-adopting a clone for edit mode.
 */
export function useQuotationViewEdit({
  projectId,
  catalogApiProjectId,
  layoutCode,
  apartmentId,
  viewOnly,
  session,
  sceneReady,
  journeyReady,
  setJourneyReady,
  pendingViewEditRef,
  designCodeRef,
  returningVisitRef,
  appliedReadyRef,
  setDesignCode,
  send,
  setParams,
  hydrateSelectionsFromStorage,
  setUeSyncStatus,
  setUeSyncError,
  allowNavigation,
}: Args) {
  const router = useRouter();
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [overridePending, setOverridePending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seededSummary, setSeededSummary] = useState<DesignSummaryData | null>(
    null,
  );
  const adoptInFlightRef = useRef(false);

  const adoptCloneFromSource = useCallback(
    async (source: string) => {
      if (!session || !catalogApiProjectId) {
        return { ok: false as const, message: "Project is not ready." };
      }
      const cloned = await cloneQuotationDesign({
        sourceDesignCode: source,
        streamProjectId: projectId,
        backendProjectId: catalogApiProjectId,
        layoutCode: session.layoutCode || layoutCode,
        apartmentId,
        persistLocalSelections: true,
        postSummary: true,
      });
      if (!cloned.ok) return cloned;

      const saved = await saveCustomizationToUe(send, cloned.designCode);
      if (!saved) {
        return {
          ok: false as const,
          message: "Could not save this design to the 3D session.",
        };
      }

      patchQuotationResume({
        mode: "edit",
        clonedDesignCode: cloned.designCode,
      });
      returningVisitRef.current = true;
      appliedReadyRef.current = true;
      setDesignCode(cloned.designCode);
      setParams({ view: false }, { replace: true });
      hydrateSelectionsFromStorage();
      if (cloned.summary) setSeededSummary(cloned.summary);
      return cloned;
    },
    [
      apartmentId,
      appliedReadyRef,
      catalogApiProjectId,
      hydrateSelectionsFromStorage,
      layoutCode,
      projectId,
      returningVisitRef,
      send,
      session,
      setDesignCode,
      setParams,
    ],
  );

  const applyViewEdit = useCallback(async () => {
    const source =
      readQuotationResume()?.sourceDesignCode ||
      designCodeRef.current?.trim() ||
      "";
    if (!source) {
      setPending(false);
      setOverridePending(false);
      return;
    }
    setError(null);
    const result = await adoptCloneFromSource(source);
    if (!result.ok) {
      setError(result.message);
      setOverridePending(false);
      setOverrideOpen(false);
      setPending(false);
    }
  }, [adoptCloneFromSource, designCodeRef]);

  // Leaving view mode (clone adopted) closes the guard without a flash.
  useEffect(() => {
    if (viewOnly) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- driven by URL view flag
    setOverrideOpen(false);
    setOverridePending(false);
    setPending(false);
  }, [viewOnly]);

  // Edit resume without a clone yet: clone once the scene is live.
  useEffect(() => {
    if (viewOnly || !sceneReady || !session) return;
    const resume = readQuotationResume();
    if (
      !resume ||
      resume.mode !== "edit" ||
      resume.clonedDesignCode ||
      resume.streamProjectId !== projectId
    ) {
      return;
    }
    if (adoptInFlightRef.current) return;
    adoptInFlightRef.current = true;
    setUeSyncStatus("Copying your design…");
    void adoptCloneFromSource(resume.sourceDesignCode).then((result) => {
      setUeSyncStatus(null);
      if (!result.ok) {
        adoptInFlightRef.current = false;
        setUeSyncError(result.message);
      }
    });
  }, [
    adoptCloneFromSource,
    projectId,
    sceneReady,
    session,
    setUeSyncError,
    setUeSyncStatus,
    viewOnly,
  ]);

  const handleViewEdit = useCallback(() => {
    if (!catalogApiProjectId) return;
    setPending(true);
    setError(null);
    if (!getValidJourneyToken()) {
      pendingViewEditRef.current = true;
      setJourneyReady(false);
      return;
    }
    pendingViewEditRef.current = false;
    if (
      hasDraftForLayout(
        projectId,
        catalogApiProjectId,
        session?.layoutCode || layoutCode,
      )
    ) {
      setOverrideOpen(true);
      return;
    }
    void applyViewEdit();
  }, [
    applyViewEdit,
    catalogApiProjectId,
    layoutCode,
    pendingViewEditRef,
    projectId,
    session?.layoutCode,
    setJourneyReady,
  ]);

  useEffect(() => {
    if (journeyReady !== true) return;
    if (!pendingViewEditRef.current) return;
    pendingViewEditRef.current = false;
    handleViewEdit();
  }, [handleViewEdit, journeyReady, pendingViewEditRef]);

  const handleViewCancel = useCallback(() => {
    if (pending) return;
    const resume = readQuotationResume();
    allowNavigation();
    const code = resume?.sourceDesignCode || designCodeRef.current;
    clearQuotationResume();
    router.push(quotationPath(code));
  }, [allowNavigation, designCodeRef, pending, router]);

  const cancelOverride = useCallback(() => {
    if (overridePending) return;
    setOverrideOpen(false);
    setPending(false);
  }, [overridePending]);

  const continueOverride = useCallback(() => {
    if (overridePending) return;
    setOverridePending(true);
    void applyViewEdit();
  }, [applyViewEdit, overridePending]);

  return {
    pending,
    error,
    overrideOpen,
    overridePending,
    seededSummary,
    handleViewEdit,
    handleViewCancel,
    cancelOverride,
    continueOverride,
  };
}
