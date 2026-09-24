"use client";

import "@/app/configurator/configurator.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isUnstartedRendersDraft,
  loadDraft,
} from "@/lib/configurator/storage";
import { readQuotationResume } from "@/lib/quotation/resume-intent";
import { deriveStreamOverlay } from "@/lib/configurator/stream-overlay";
import { AFK_CONFIG } from "@/lib/stream-pixel/afk";
import {
  backendProjectIdFromUrl,
  isBackendProjectId,
  isStreamProjectId,
} from "@/lib/projects/project-id";
import { readJourney } from "@/lib/journey";
import { currentResidenceSubtitle } from "@/lib/configurator/residence-label";
import { setStreamResolution } from "@/lib/stream-pixel/stream-control";
import { logUeSend } from "@/lib/stream-pixel/ue-logger";
import type { ResolutionOption } from "@/lib/stream-pixel/types";
import type { MeshRulesConfig } from "@/types/configurator";
import { useShareableParams } from "@/hooks/configurator/use-shareable-params";
import { useSelectionMap } from "@/hooks/configurator/use-selection-map";
import { useStreamPixel } from "@/hooks/configurator/use-stream-pixel";
import { useUeInteraction } from "@/hooks/configurator/use-ue-interaction";
import { useDesignSummary } from "@/hooks/configurator/use-design-summary";
import { useRenderJob } from "@/hooks/configurator/use-render-job";
import { useConfiguratorBoot } from "@/hooks/configurator/use-configurator-boot";
import { useUeResponse } from "@/hooks/configurator/use-ue-response";
import { useCatalogNavigation } from "@/hooks/configurator/use-catalog-navigation";
import { useUeSync } from "@/hooks/configurator/use-ue-sync";
import { useSelectionActions } from "@/hooks/configurator/use-selection-actions";
import { useFrozenDesign } from "@/hooks/configurator/use-frozen-design";
import { useQuotationViewEdit } from "@/hooks/configurator/use-quotation-view-edit";
import { useConfirmSelection } from "@/hooks/configurator/use-confirm-selection";
import { useLeaveGuard } from "@/hooks/configurator/use-leave-guard";
import StreamViewport from "./stream-viewport";
import LoadingOverlay from "./loading-overlay";
import AfkWarningOverlay from "./afk-warning-overlay";
import QuotationDialog from "./quotation-dialog";
import UeLogSidebar from "./ue-log-sidebar";
import CustomizationRequiredDialog from "./customization-required-dialog";
import QuotationReady from "./quotation-ready";
import RendersNotReadyDialog from "./renders-not-ready-dialog";
import ViewOnlyBanner from "./view-only-banner";
import FinalDesignProgress from "./final-design/final-design-progress";
import FinalDesignViewer from "./final-design/final-design-viewer";
import ReviewSelections from "./review-selections";
import JourneyGate from "./journey-gate";
import ConfiguratorStage from "./configurator-stage";
import ConfiguratorDialogs from "./configurator-dialogs";
import SelectStyle from "@/components/pages/styles/select-style";

const ConfiguratorShell = ({ projectId }: { projectId: string }) => {
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { params, setParams } = useShareableParams(projectId);
  const viewOnly = Boolean(params.view);
  const unitId = params.apartmentNumber?.trim() || params.unit?.trim() || null;
  const apartmentId = params.apartmentId?.trim() || null;
  const catalogApiProjectId = backendProjectIdFromUrl(
    params.backendProjectId,
    projectId,
  );
  const storageProjectId = catalogApiProjectId || "";
  const layoutCode = params.layoutCode?.trim() || "";

  const boot = useConfiguratorBoot({
    projectId,
    catalogApiProjectId,
    layoutCode,
    apartmentId,
    unitId,
    viewOnly,
    setParams,
  });
  const {
    journeyReady,
    session,
    sessionError,
    sessionLoading,
    designCode,
    designCodeRef,
    setDesignCode,
    returningVisitRef,
  } = boot;

  const [reviewOpen, setReviewOpen] = useState(false);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [customizationRequiredOpen, setCustomizationRequiredOpen] =
    useState(false);
  const [streamOverlayDismissed, setStreamOverlayDismissed] = useState(false);
  const [browseStylesOpen, setBrowseStylesOpen] = useState(false);
  const [selectionsOpen, setSelectionsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentResolution, setCurrentResolution] = useState("Auto");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const resumedRendersRef = useRef(false);

  const guard = useLeaveGuard(
    [
      params.zone,
      params.camera,
      params.layoutCode,
      params.view,
      params.renders,
      params.apartmentId,
      params.apartmentNumber,
    ].join("|"),
  );
  const { allowNavigation, allowReload } = guard;

  const sceneConfig: MeshRulesConfig = useMemo(
    () =>
      session
        ? { cameras: session.cameras, meshes: session.meshes }
        : { cameras: [], meshes: [] },
    [session],
  );

  const selections = useSelectionMap({
    streamProjectId: projectId,
    backendProjectId: storageProjectId,
    layoutCode,
    apartmentId,
    designCode,
    session,
    viewOnly,
  });

  const ueEventRef = useRef<(response: unknown) => void>(() => {});
  const handleUeResponse = useUeResponse(ueEventRef);

  const quotationResume = readQuotationResume();
  const quotationEditPendingClone =
    quotationResume?.mode === "edit" && !quotationResume.clonedDesignCode;
  const holdStreamForQuotation =
    !designCode &&
    (quotationResume?.mode === "edit" || quotationResume?.mode === "fresh");

  const stream = useStreamPixel({
    projectId,
    streamerId: params.streamerId,
    sfuHost: params.sfuHost,
    sfuPlayer: params.sfuPlayer,
    onUeResponse: handleUeResponse,
    videoContainerRef,
    fullscreenTargetRef: shellRef,
    enabled: !holdStreamForQuotation,
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- re-arm overlay when the stream reloads
    if (!stream.isLoading) setStreamOverlayDismissed(false);
  }, [stream.isLoading]);

  const { sendUEInteraction } = useUeInteraction(
    stream.pixelStreamingRef,
    stream.streamReadyRef,
  );

  const send = useCallback(
    (payload: Parameters<typeof sendUEInteraction>[0]) => {
      const fn = (payload as { Function?: string }).Function;
      if (fn !== "ConfiguratorReadyProbe") {
        console.info("[UE send]", payload);
        logUeSend(payload);
      }
      return sendUEInteraction(payload);
    },
    [sendUEInteraction],
  );

  const closeEditOverlays = useCallback(() => {
    setReviewOpen(false);
    setQuoteDialogOpen(false);
    setSelectionsOpen(false);
  }, []);

  const closeReviewAndQuote = useCallback(() => {
    setReviewOpen(false);
    setQuoteDialogOpen(false);
  }, []);

  const nav = useCatalogNavigation({
    session,
    sceneConfig,
    zoneParam: params.zone,
    cameraParam: params.camera,
    setParams,
    viewOnly,
    send,
    onEnterEdit: closeEditOverlays,
  });
  const { setSidePanelOpen } = nav;

  useEffect(() => {
    ueEventRef.current = nav.handleUeZoneEvent;
  }, [nav.handleUeZoneEvent]);

  const storage = useMemo(
    () => ({
      streamProjectId: projectId,
      projectId: storageProjectId,
      layoutCode: session?.layoutCode || layoutCode,
      apartmentId,
    }),
    [apartmentId, layoutCode, projectId, session?.layoutCode, storageProjectId],
  );

  const ueSync = useUeSync({
    session,
    layoutCode,
    viewOnly,
    send,
    streamLoading: stream.isLoading,
    selectionsHydrated: selections.hydrated,
    designCode,
    designCodeRef,
    returningVisitRef,
    pixelStreamingRef: stream.pixelStreamingRef,
    streamReadyRef: stream.streamReadyRef,
    videoContainerRef,
    prepareViewForSync: nav.prepareViewForSync,
    storage,
  });

  const renderJob = useRenderJob({
    enabled: journeyReady === true && !viewOnly && !quotationEditPendingClone,
    send,
    streamProjectId: projectId,
    backendProjectId: storageProjectId,
    layoutCode,
    apartmentId,
    designCode,
    session,
    customMap: selections.map,
  });

  const resetSelections = useCallback(() => {
    selections.resetAll();
    selections.commitReset();
  }, [selections]);

  const frozen = useFrozenDesign({
    session,
    catalogApiProjectId,
    projectId,
    layoutCode,
    apartmentId,
    rendersParam: Boolean(params.renders),
    selectionMap: selections.map,
    resetSelections,
    designCodeRef,
    returningVisitRef,
    resumedRendersRef,
    setDesignCode,
    send,
    isUeReady: ueSync.isUeReady,
    markSceneReady: ueSync.markSceneReady,
    renderJob,
    runLoadThenCaptureHighRes: ueSync.runLoadThenCaptureHighRes,
    setParams,
    closeOverlays: closeReviewAndQuote,
    allowNavigation,
  });

  const designSummary = useDesignSummary({
    enabled:
      journeyReady === true &&
      !viewOnly &&
      !quotationEditPendingClone &&
      Boolean(session && designCode && selections.hydrated),
    streamProjectId: projectId,
    backendProjectId: storageProjectId,
    layoutCode,
    apartmentId,
    designCode,
    session,
    customMap: selections.map,
    onFrozen: frozen.openFrozen,
  });

  const viewEdit = useQuotationViewEdit({
    projectId,
    catalogApiProjectId,
    layoutCode,
    apartmentId,
    viewOnly,
    session,
    sceneReady: ueSync.sceneReady,
    journeyReady,
    setJourneyReady: boot.setJourneyReady,
    pendingViewEditRef: boot.pendingViewEditRef,
    designCodeRef,
    returningVisitRef,
    appliedReadyRef: ueSync.appliedReadyRef,
    setDesignCode,
    send,
    setParams,
    hydrateSelectionsFromStorage: selections.hydrateFromStorage,
    setUeSyncStatus: ueSync.setUeSyncStatus,
    setUeSyncError: ueSync.setUeSyncError,
    allowNavigation,
  });

  const confirm = useConfirmSelection({
    allReady: renderJob.allReady,
    stopRenders: renderJob.stop,
    designCode,
    designCodeRef,
    setDesignCode,
    storage,
    setParams,
  });

  const actions = useSelectionActions({
    session,
    selections,
    activeRule: nav.activeRule,
    viewOnly,
    send,
    designCodeRef,
    onResetDone: nav.handleFreeCamera,
  });

  // Hydrate FE selections from storage only — never paint them onto UE
  useEffect(() => {
    if (!session || !designCode) return;
    if (viewOnly || quotationEditPendingClone) {
      selections.hydrateFromDesign([]);
      return;
    }
    selections.hydrateFromStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, viewOnly, designCode, quotationEditPendingClone]);

  // `renders=1` in the URL resumes polling unless the draft never started.
  useEffect(() => {
    if (!params.renders || viewOnly || !designCode || !session) return;
    const draft = loadDraft(
      projectId,
      storageProjectId,
      session.layoutCode || layoutCode,
      apartmentId,
    );
    if (isUnstartedRendersDraft(draft)) {
      setParams({ renders: false }, { replace: true });
      resumedRendersRef.current = false;
      return;
    }
    if (frozen.open || resumedRendersRef.current) return;
    resumedRendersRef.current = true;
    setReviewOpen(false);
    renderJob.resume();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    params.renders,
    viewOnly,
    designCode,
    session,
    frozen.open,
    apartmentId,
    layoutCode,
    projectId,
    storageProjectId,
  ]);

  const overlay = deriveStreamOverlay({
    sessionError,
    hasSession: Boolean(session),
    sessionLoading,
    sceneReady: ueSync.sceneReady,
    dismissed: streamOverlayDismissed,
    ueSyncStatus: ueSync.ueSyncStatus,
    stream,
  });

  const canReconnect =
    Boolean(projectId) &&
    isStreamProjectId(projectId, projectId) &&
    isBackendProjectId(catalogApiProjectId) &&
    Boolean((params.layoutCode || session?.layoutCode || "").trim()) &&
    !sessionError;

  useEffect(() => {
    if (overlay.kind !== "idle" && overlay.kind !== "disconnected") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- stream went offline; close interactive layers
    if (overlay.kind === "idle") setStreamOverlayDismissed(false);
    setQuoteDialogOpen(false);
    setReviewOpen(false);
    setSelectionsOpen(false);
    setSettingsOpen(false);
    setBrowseStylesOpen(false);
  }, [overlay.kind]);

  const reloadSession = useCallback(() => {
    allowReload();
    window.location.reload();
  }, [allowReload]);

  const goToProjects = useCallback(() => {
    allowNavigation();
    router.push("/projects");
  }, [allowNavigation, router]);

  const handleOpenQuote = useCallback(() => {
    setSelectionsOpen(false);
    setSettingsOpen(false);
    setSidePanelOpen(false);
    if (!selections.selections.length) {
      setCustomizationRequiredOpen(true);
      return;
    }
    setQuoteDialogOpen(true);
  }, [selections.selections.length, setSidePanelOpen]);

  const handleLoadLevel = useCallback(
    (levelName: string) => {
      if (viewOnly) return;
      setParams({ layoutCode: levelName }, { replace: true });
    },
    [viewOnly, setParams],
  );

  const handleChangeResolution = (option: ResolutionOption) => {
    setCurrentResolution(option.label);
    setStreamResolution(
      {
        pixelStreaming: stream.pixelStreamingRef.current,
        uiControl: stream.uiControlRef.current,
        appStream: stream.appStreamRef.current,
        container: videoContainerRef.current,
      },
      option,
    );
    setSettingsOpen(false);
  };

  const handleStartOwn = useCallback(() => {
    confirm.reset();
    setParams({ view: false }, { replace: true });
    resetSelections();
  }, [confirm, setParams, resetSelections]);

  const unitSubtitle = currentResidenceSubtitle();

  return (
    <div className="configurator-shell" ref={shellRef}>
      <StreamViewport ref={videoContainerRef} />
      <UeLogSidebar />

      {overlay.show ? (
        <LoadingOverlay
          kind={overlay.kind}
          progress={overlay.progress}
          unitSubtitle={unitSubtitle}
          queuePosition={stream.queuePosition}
          selectionCount={selections.selections.length}
          reconnectTitle={stream.loadingTitle}
          reconnectSubtitle={stream.loadingSubtitle}
          endedEyebrow={
            overlay.kind === "error"
              ? sessionError
                ? "Unable to load"
                : "Unable to open"
              : stream.endedCopy.eyebrow
          }
          endedTitle={
            overlay.kind === "error"
              ? sessionError
                ? "This apartment could not be loaded"
                : "The 3D session could not open"
              : stream.endedCopy.title
          }
          endedMessage={
            overlay.kind === "error"
              ? sessionError ||
                "We couldn’t open the 3D session. Try reconnecting."
              : null
          }
          onReconnect={canReconnect ? reloadSession : undefined}
          onContinueToSummary={() => {
            setStreamOverlayDismissed(true);
            setQuoteDialogOpen(false);
            setReviewOpen(true);
          }}
          onBackHome={goToProjects}
          onBrowseStyles={() => setBrowseStylesOpen(true)}
          progressLabel={
            overlay.kind === "loading"
              ? ueSync.ueSyncStatus || stream.loadingStatus || null
              : null
          }
          bootError={
            overlay.kind === "loading" && ueSync.ueSyncError
              ? ueSync.ueSyncError
              : null
          }
          onRetryBoot={
            overlay.kind === "loading" && ueSync.ueSyncError
              ? ueSync.retrySync
              : undefined
          }
        />
      ) : null}

      {browseStylesOpen ? (
        <SelectStyle
          overlay
          onStartCustomizing={() => setBrowseStylesOpen(false)}
          onSelectStyle={() => setBrowseStylesOpen(false)}
          streamProjectId={projectId}
          projectId={catalogApiProjectId}
          apartmentId={apartmentId}
          apartmentNumber={unitId}
          unitId={unitId}
          levelName={layoutCode}
        />
      ) : null}

      {ueSync.ueSyncStatus && ueSync.sceneReady && (
        <div className="cfg-sync-overlay" aria-live="polite">
          <p>{ueSync.ueSyncStatus}</p>
        </div>
      )}

      {ueSync.ueSyncError && !overlay.show && (
        <div className="cfg-sync-error">
          <p>{ueSync.ueSyncError}</p>
          <button
            type="button"
            className="cfg-primary-btn"
            onClick={ueSync.retrySync}
          >
            Re-apply finishes
          </button>
        </div>
      )}

      {overlay.showAfkWarning ? (
        <AfkWarningOverlay
          countdown={stream.afkCountdown}
          total={AFK_CONFIG.countdownSeconds}
          onStay={stream.dismissAfk}
        />
      ) : null}

      {viewOnly && designCode && quotationResume?.mode !== "view" && (
        <ViewOnlyBanner designCode={designCode} onStartOwn={handleStartOwn} />
      )}

      {selections.storageWarning && !viewOnly && (
        <div className="absolute left-4 top-16 z-30 max-w-xs rounded-lg bg-amber-900/80 px-3 py-2 text-xs text-amber-50">
          {selections.storageWarning}
        </div>
      )}

      {ueSync.sceneReady && session && (
        <ConfiguratorStage
          session={session}
          nav={nav}
          actions={actions}
          selections={selections}
          viewOnly={viewOnly}
          inert={overlay.showAfkWarning}
          selectionsOpen={selectionsOpen}
          onToggleSelections={() => setSelectionsOpen((v) => !v)}
          onCloseSelections={() => setSelectionsOpen(false)}
          settingsOpen={settingsOpen}
          onToggleSettings={() => setSettingsOpen((v) => !v)}
          currentResolution={currentResolution}
          onChangeResolution={handleChangeResolution}
          resolutionEnabled={stream.resolutionEnabled}
          onFullscreen={stream.requestFullscreen}
          onReset={() => setResetDialogOpen(true)}
          onQuote={handleOpenQuote}
          onLoadLevel={handleLoadLevel}
          onViewEdit={viewEdit.handleViewEdit}
          onViewCancel={viewEdit.handleViewCancel}
          viewEditPending={viewEdit.pending}
        />
      )}

      <QuotationReady
        open={confirm.quotationReady}
        designCode={confirm.confirmedQuote?.design_code ?? designCode ?? ""}
        unitSubtitle={unitSubtitle}
        email={readJourney()?.customer.email}
        pdfStatus={confirm.confirmedQuote?.pdf_status}
        emailStatus={confirm.confirmedQuote?.email_status}
      />

      {session ? (
        <>
          <QuotationDialog
            open={quoteDialogOpen && !viewOnly}
            onBack={() => setQuoteDialogOpen(false)}
            onGoToSummary={() => {
              setQuoteDialogOpen(false);
              setReviewOpen(true);
            }}
          />

          <CustomizationRequiredDialog
            open={customizationRequiredOpen && !viewOnly}
            onClose={() => setCustomizationRequiredOpen(false)}
          />

          <RendersNotReadyDialog
            open={confirm.rendersNotReadyOpen}
            onClose={confirm.closeRendersNotReady}
          />

          <ReviewSelections
            open={reviewOpen && !viewOnly && !renderJob.active}
            session={session}
            selections={selections.selections}
            unitSubtitle={unitSubtitle}
            summary={designSummary.data ?? viewEdit.seededSummary}
            summaryLoading={
              designSummary.loading &&
              !(designSummary.data ?? viewEdit.seededSummary)
            }
            summaryError={
              designSummary.data || viewEdit.seededSummary
                ? null
                : designSummary.error
            }
            confirmPending={renderJob.preparing}
            confirmError={renderJob.active ? null : renderJob.error}
            actionsDisabled={overlay.blocking && !overlay.offline}
            streamOffline={overlay.offline}
            onReconnect={canReconnect ? reloadSession : undefined}
            onBack={closeReviewAndQuote}
            onConfirm={async () => {
              const ok = await renderJob.start();
              if (!ok) return;
              resumedRendersRef.current = true;
              closeReviewAndQuote();
              setParams({ renders: true }, { replace: true });
              void ueSync.runLoadThenCaptureHighRes();
            }}
            onRemove={actions.handleRemoveSelection}
            onEdit={nav.handleEditReviewSlot}
          />

          <FinalDesignProgress
            open={
              !viewOnly &&
              !confirm.quotationReady &&
              !frozen.open &&
              !frozen.keepStreamWaitingOpen &&
              frozen.pending !== "keep" &&
              (renderJob.active || Boolean(params.renders))
            }
            rooms={renderJob.rooms}
            unitSubtitle={unitSubtitle}
            error={renderJob.error}
            total={renderJob.totalAmount}
            confirmPending={confirm.pending}
            confirmDisabled={renderJob.confirmDisabled}
            confirmError={confirm.error}
            onConfirm={() => {
              void confirm.confirm();
            }}
            onView={renderJob.openViewer}
            onRetry={renderJob.retryRoom}
          />

          <FinalDesignViewer
            stills={renderJob.stills}
            index={renderJob.lightboxIndex}
            onIndexChange={renderJob.setLightboxIndex}
            onClose={renderJob.closeViewer}
          />
        </>
      ) : null}

      <ConfiguratorDialogs
        viewOnly={viewOnly}
        resetOpen={resetDialogOpen}
        onResetCancel={() => setResetDialogOpen(false)}
        onResetConfirm={() => {
          setResetDialogOpen(false);
          actions.confirmReset();
        }}
        frozen={frozen}
        onGoToProjects={goToProjects}
        leaveOpen={guard.leaveOpen}
        onStay={guard.stay}
        onLeave={guard.confirmLeave}
        viewEdit={viewEdit}
      />

      {journeyReady === false ? (
        <JourneyGate onReady={() => boot.setJourneyReady(true)} />
      ) : null}
    </div>
  );
};

export default ConfiguratorShell;
