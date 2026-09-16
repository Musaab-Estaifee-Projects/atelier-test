/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/refs */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import "@/app/configurator/configurator.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiError,
  getConfiguratorSession,
  submitDesign,
} from "@/lib/configurator/api";
import {
  captureCamerasHighResOnUe,
  applyOneSelectionToUe,
  exitCameraOnUe,
  moveToZoneOnUe,
  resetToDefaultOnUe,
  saveCustomizationToUe,
  shouldApplyMaterialToMesh,
  switchCameraByNameOnUe,
} from "@/lib/configurator/apply-ue";
import {
  invalidateUeSyncCache,
  syncDraftToUe,
  UE_SYNC_FAIL,
  type UeSyncResult,
} from "@/lib/configurator/sync-to-ue";
import { getMeshesForCamera } from "@/lib/configurator/mesh-rules";
import { appliedSelectionMap, clearDraft, isUnstartedRendersDraft, loadDraft, markFreshStartIntent, patchDraft } from "@/lib/configurator/storage";
import { customMapToStored } from "@/lib/configurator/api-selections";
import {
  createReplacementDesign,
  ensureBackendDesign,
} from "@/lib/configurator/ensure-design";
import {
  locationWithoutRenders,
  normalizeZone,
  zoneUrlPatch,
} from "@/lib/configurator/url-params";
import {
  camerasForZone,
  cameraKey,
  matchZoneId,
  moveZoneName,
  setActiveCatalogZones,
  shortSurfaceLabel,
  zoneIdForCamera,
  zoneIdFromCamera,
} from "@/lib/configurator/zone-catalog";
import { AFK_CONFIG } from "@/lib/stream-pixel/afk";
import { DEFAULT_LAYOUT_CODE } from "@/lib/projects/catalog";
import { backendProjectIdFromUrl, isBackendProjectId, isStreamProjectId } from "@/lib/projects/project-id";
import { getValidJourneyToken, readJourney } from "@/lib/journey";
import type {
  CameraRule,
  ConfiguratorCamera,
  ConfiguratorSession,
  MaterialOption,
  MeshOption,
  MeshRulesConfig,
  SelectionEntry,
  StoredDesign,
  SubmitDesignResult,
} from "@/types/configurator";
import type { ResolutionOption } from "@/lib/stream-pixel/types";
import { useShareableParams } from "@/hooks/configurator/use-shareable-params";
import { useCameraZone } from "@/hooks/configurator/use-camera-zone";
import { useSelectionMap } from "@/hooks/configurator/use-selection-map";
import { useStreamPixel } from "@/hooks/configurator/use-stream-pixel";
import { useUeInteraction } from "@/hooks/configurator/use-ue-interaction";
import {
  extractCameraZoneFromResponse,
  extractCustomizationEvent,
  extractUeCommandAck,
  parseUeResponse,
} from "@/lib/stream-pixel/parse-ue-response";
import { logUeResponse, logUeSend } from "@/lib/stream-pixel/ue-logger";
import {
  noteUeAck,
  noteUeLoadId,
  noteCustomizationResult,
} from "@/lib/configurator/ue-load-id";
import { currentResidenceSubtitle } from "@/lib/configurator/residence-label";
import { useFinalDesign } from "@/hooks/configurator/use-final-design";
import { useDesignSummary } from "@/hooks/configurator/use-design-summary";
import { useRenderJob } from "@/hooks/configurator/use-render-job";
import StreamViewport from "./stream-viewport";
import LoadingOverlay, { streamOverlayKind } from "./loading-overlay";
import AfkWarningOverlay from "./afk-warning-overlay";
import QuotationDialog from "./quotation-dialog";
import UeLogSidebar from "./ue-log-sidebar";
import ZoneTopBar from "./zone-top-bar";
import ZoneSidePanel from "./zone-side-panel";
import ConfiguratorDock from "./configurator-dock";
import CustomizationRequiredDialog from "./customization-required-dialog";
import ResetToDefaultDialog from "./reset-to-default-dialog";
import SelectionsSheet from "./selections-sheet";
import SubmitModal from "./submit-modal";
import QuotationReady from "./quotation-ready";
import RendersNotReadyDialog from "./renders-not-ready-dialog";
import ViewOnlyBanner from "./view-only-banner";
import FinalDesignProgress from "./final-design/final-design-progress";
import FinalDesignViewer from "./final-design/final-design-viewer";
import ReviewSelections from "./review-selections";
import LeaveConfiguratorDialog from "./leave-configurator-dialog";
import FrozenDesignDialog from "./frozen-design-dialog";
import KeepCustomizationFailedDialog from "./keep-customization-failed-dialog";
import JourneyGate from "./journey-gate";
import SelectStyle from "@/components/pages/styles/select-style";

const MOCK_UE =
  process.env.NEXT_PUBLIC_MOCK_UE === "true" ||
  process.env.NEXT_PUBLIC_STREAMPIXEL_MOCK === "true";

const ConfiguratorShell = ({ projectId }: { projectId: string }) => {
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { params, setParams } = useShareableParams(projectId);
  const viewOnly = Boolean(params.view);
  const unitId =
    params.apartmentNumber?.trim() || params.unit?.trim() || null;
  const apartmentId = params.apartmentId?.trim() || null;
  const catalogApiProjectId = backendProjectIdFromUrl(
    params.backendProjectId,
    projectId,
  );
  const storageProjectId = catalogApiProjectId || "";
  const layoutCode = params.layoutCode?.trim() || DEFAULT_LAYOUT_CODE;

  const [journeyReady, setJourneyReady] = useState<boolean | null>(null);
  const returningVisitRef = useRef(false);
  const designCodeRef = useRef<string | null>(null);
  const [designCode, setDesignCode] = useState<string | null>(null);

  const [session, setSession] = useState<ConfiguratorSession | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [design, setDesign] = useState<StoredDesign | null>(null);
  const [designError, setDesignError] = useState<string | null>(null);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [customizationRequiredOpen, setCustomizationRequiredOpen] =
    useState(false);
  const [streamOverlayDismissed, setStreamOverlayDismissed] = useState(false);
  const [browseStylesOpen, setBrowseStylesOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitPending, setSubmitPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SubmitDesignResult | null>(null);
  const [quotationReady, setQuotationReady] = useState(false);
  const [rendersNotReadyOpen, setRendersNotReadyOpen] = useState(false);
  const [ueSyncStatus, setUeSyncStatus] = useState<string | null>(null);
  const [ueSyncError, setUeSyncError] = useState<string | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [frozenDesignOpen, setFrozenDesignOpen] = useState(false);
  const [frozenDesignPending, setFrozenDesignPending] = useState<
    "new" | "keep" | null
  >(null);
  const [frozenFromRenders, setFrozenFromRenders] = useState(false);
  const [keepCustomizationFailedOpen, setKeepCustomizationFailedOpen] =
    useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const [activeZoneId, setActiveZoneId] = useState<string | null>(() =>
    matchZoneId(params.zone),
  );
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [freeCameraActive, setFreeCameraActive] = useState(
    () => !params.camera,
  );
  const [activeCameraKey, setActiveCameraKey] = useState<string | null>(null);
  const [activeRule, setActiveRule] = useState<CameraRule | null>(null);
  const [selectionsOpen, setSelectionsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentResolution, setCurrentResolution] = useState("Auto");

  const appliedReadyRef = useRef(false);
  const highResPipelineRef = useRef(false);
  const [sceneReady, setSceneReady] = useState(false);
  const loadedLevelRef = useRef<string | null>(null);
  const lastZoneInUrlRef = useRef<string | null>(params.zone ?? null);
  const freeModeRef = useRef(true);
  const cameraParamRef = useRef<string | null>(params.camera ?? null);
  cameraParamRef.current = params.camera ?? null;
  const lastUeResponseKeyRef = useRef<string>("");
  const lastUeResponseAtRef = useRef(0);
  const ignoreUeZoneUntilRef = useRef(0);
  const zoneEnterTimerRef = useRef<number | null>(null);
  const activeZoneIdRef = useRef<string | null>(activeZoneId);
  activeZoneIdRef.current = activeZoneId;
  const ingestRenderRef = useRef<(response: unknown) => void>(() => {});
  const capturePhaseRef = useRef<string>("idle");
  const allowUnloadRef = useRef(false);
  const skipPopGuardRef = useRef(false);
  const pendingLeaveRef = useRef<"back" | string | null>(null);
  const stayHrefRef = useRef("");

  const sceneConfig: MeshRulesConfig = useMemo(
    () =>
      session
        ? { cameras: session.cameras, meshes: session.meshes }
        : { cameras: [], meshes: [] },
    [session],
  );

  const cameraZone = useCameraZone(sceneConfig);
  const zoneCamerasRef = useRef(cameraZone.zoneCameras);
  zoneCamerasRef.current = cameraZone.zoneCameras;

  const selections = useSelectionMap({
    streamProjectId: projectId,
    backendProjectId: storageProjectId,
    layoutCode,
    apartmentId,
    designCode,
    session,
    viewOnly,
  });

  const handleUeResponse = useCallback(
    (response: unknown) => {
      let parsed: unknown = response;
      try {
        parsed = parseUeResponse(response);
      } catch {
        parsed = response;
      }
      const key = JSON.stringify(parsed);
      const now = Date.now();
      if (
        key !== lastUeResponseKeyRef.current ||
        now - lastUeResponseAtRef.current > 200
      ) {
        lastUeResponseKeyRef.current = key;
        lastUeResponseAtRef.current = now;
        console.info("[UE response]", parsed);
        logUeResponse(parsed);
      }

      const custom = extractCustomizationEvent(response);
      const ack = extractUeCommandAck(response);
      if (ack) {
        noteUeAck(ack);
      } else if (custom?.kind === "saved") {
        noteUeAck({
          type: "SaveCustomization",
          ok: true,
          status: "success",
          code: 200,
        });
      } else if (custom?.kind === "error" && custom.op === "save") {
        noteUeAck({
          type: "SaveCustomization",
          ok: false,
          status: "failed",
          code: 404,
        });
      }

      if (
        custom?.kind === "loaded" ||
        (custom?.kind === "error" && custom.op !== "save")
      ) {
        noteCustomizationResult(custom.kind);
      }
      if (custom?.loadId) noteUeLoadId(custom.loadId);
      ingestRenderRef.current(response);
      if (capturePhaseRef.current === "capturing") return;
      cameraZone.applyCameraZoneUpdate(response);

      const data = extractCameraZoneFromResponse(response);
      if (!data) return;
      if (Date.now() < ignoreUeZoneUntilRef.current) return;
      // Fixed camera is FE-owned. Free roam: UE zone enter updates URL zone.
      if (cameraParamRef.current) return;
      if (data.event === "exit") return;

      const zid =
        matchZoneId(data.zone) ??
        zoneIdFromCamera(data.cameras[0] ?? undefined);
      const zoneUe = zid
        ? (moveZoneName(zid) ?? zid)
        : normalizeZone(data.zone);
      if (!zoneUe || zoneUe === lastZoneInUrlRef.current) return;
      if (zoneEnterTimerRef.current != null) {
        window.clearTimeout(zoneEnterTimerRef.current);
      }
      zoneEnterTimerRef.current = window.setTimeout(() => {
        zoneEnterTimerRef.current = null;
        if (cameraParamRef.current) return;
        if (Date.now() < ignoreUeZoneUntilRef.current) return;
        lastZoneInUrlRef.current = zoneUe;
        setParams({ zone: zoneUe, camera: null }, { replace: true });
      }, 180);
    },
    [cameraZone, setParams],
  );

  const stream = useStreamPixel({
    projectId,
    streamerId: params.streamerId,
    sfuHost: params.sfuHost,
    sfuPlayer: params.sfuPlayer,
    onUeResponse: handleUeResponse,
    videoContainerRef,
    fullscreenTargetRef: shellRef,
  });

  useEffect(() => {
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
      if (MOCK_UE) {
        if (fn !== "ConfiguratorReadyProbe") {
          console.info("[mock UE]", payload);
        }
        return true;
      }
      return sendUEInteraction(payload);
    },
    [sendUEInteraction],
  );

  const finalDesign = useFinalDesign({
    send,
    mockUe: MOCK_UE,
    sceneConfig,
    videoContainerRef,
    design_code: designCode,
  });
  ingestRenderRef.current = finalDesign.ingestUeResponse;
  capturePhaseRef.current = finalDesign.phase;

  const designSummary = useDesignSummary({
    enabled:
      journeyReady === true &&
      !viewOnly &&
      Boolean(session && designCode && selections.hydrated),
    streamProjectId: projectId,
    backendProjectId: storageProjectId,
    layoutCode,
    apartmentId,
    designCode,
    session,
    customMap: selections.map,
    onFrozen: () => {
      setFrozenFromRenders(Boolean(params.renders));
      setFrozenDesignOpen(true);
    },
  });

  const renderJob = useRenderJob({
    enabled: journeyReady === true && !viewOnly,
    send,
    mockUe: MOCK_UE,
    streamProjectId: projectId,
    backendProjectId: storageProjectId,
    layoutCode,
    apartmentId,
    designCode,
    session,
    customMap: selections.map,
  });
  const resumedRendersRef = useRef(false);

  useEffect(() => {
    if (viewOnly) {
      setJourneyReady(true);
      return;
    }
    setJourneyReady(Boolean(getValidJourneyToken()));
  }, [viewOnly]);

  useEffect(() => {
    if (journeyReady === false) setSessionLoading(false);
  }, [journeyReady]);

  const isUeReady = useCallback(() => {
    if (MOCK_UE) return true;
    const ps = stream.pixelStreamingRef.current as {
      emitUIInteraction?: (p: Record<string, unknown>) => boolean | void;
    } | null;
    if (!stream.streamReadyRef.current || !ps?.emitUIInteraction) return false;
    const video = videoContainerRef.current?.querySelector(
      "video",
    ) as HTMLVideoElement | null;
    return Boolean(video && video.readyState >= 2);
  }, [stream.pixelStreamingRef, stream.streamReadyRef]);

  const runUeSync = useCallback(
    async (opts?: {
      force?: boolean;
      skipLoadLevel?: boolean;
      skipViewRestore?: boolean;
      requireLoadCustomization?: boolean;
    }) => {
      if (!session) return { ...UE_SYNC_FAIL };
      if (viewOnly) return { ...UE_SYNC_FAIL };

      const code = designCodeRef.current;
      setUeSyncError(null);
      if (returningVisitRef.current && code) {
        setUeSyncStatus("Restoring your saved finishes…");
      }

      ignoreUeZoneUntilRef.current = Date.now() + 6000;

      const zone = normalizeZone(params.zone);
      const camera = params.camera ?? null;
      const levelName = session.layoutCode || layoutCode;

      if (camera) {
        const rule = session.cameras.find((c) => c.name === camera);
        const camObj: ConfiguratorCamera = rule
          ? { name: rule.name, index: Number(rule.index ?? 0), mode: rule.mode }
          : { name: camera, index: 0 };
        cameraZone.hydrateFromShare({
          zone,
          cameras: [camObj],
          activeIndex: rule?.index != null ? Number(rule.index) : 0,
        });
        const zid = matchZoneId(zone) ?? zoneIdFromCamera(camObj);
        if (zid) setActiveZoneId(zid);
        setActiveRule(rule ?? null);
        setActiveCameraKey(rule ? cameraKey(rule) : camera);
        setFreeCameraActive(false);
        freeModeRef.current = false;
      } else if (zone) {
        const zid = matchZoneId(zone);
        if (zid) setActiveZoneId(zid);
        setFreeCameraActive(true);
        freeModeRef.current = true;
      }

      try {
        const result = await syncDraftToUe({
          send,
          isUeReady,
          layoutCode: levelName,
          designCode: code,
          returningVisit: returningVisitRef.current,
          zone,
          camera: camera ?? null,
          skipLoadLevel: opts?.skipLoadLevel,
          skipViewRestore: opts?.skipViewRestore,
          requireLoadCustomization: opts?.requireLoadCustomization,
          force: opts?.force,
          mockLog: MOCK_UE,
          onProgress: (msg) => setUeSyncStatus(msg),
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
      design,
      params.zone,
      params.camera,
      layoutCode,
      cameraZone,
      send,
      isUeReady,
      selections.selections,
    ],
  );

  const runUeSyncRef = useRef(runUeSync);
  runUeSyncRef.current = runUeSync;

  const runLoadThenCaptureHighRes = useCallback(async () => {
    const code = designCodeRef.current;
    if (!code) return false;
    highResPipelineRef.current = true;
    returningVisitRef.current = true;
    try {
      const synced: UeSyncResult = await runUeSyncRef.current({
        force: !appliedReadyRef.current,
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
      const sent = await captureCamerasHighResOnUe(send, code, {
        mockLog: MOCK_UE,
      });
      if (sent) {
        patchDraft(
          {
            streamProjectId: projectId,
            projectId: storageProjectId,
            layoutCode,
            apartmentId,
          },
          { highResCaptureSent: true },
        );
      } else {
        console.warn("[UE] CaptureCamerasHighRes emit was not accepted");
      }
      return sent;
    } finally {
      highResPipelineRef.current = false;
    }
  }, [apartmentId, layoutCode, projectId, send, storageProjectId]);

  // Boot session / design
  useEffect(() => {
    if (journeyReady !== true) return;
    let cancelled = false;
    (async () => {
      setSessionLoading(true);
      setSessionError(null);
      setDesignError(null);

      try {
        if (!catalogApiProjectId) {
          throw new Error(
            "A valid project is required to load this apartment catalog.",
          );
        }

        const sess = await getConfiguratorSession({
          streamProjectId: projectId,
          backendProjectId: catalogApiProjectId,
          layoutCode,
          unitId,
        });
        if (cancelled) return;
        setActiveCatalogZones(sess.zones);
        setSession(sess);

        if (!viewOnly) {
          const ensured = await ensureBackendDesign({
            streamProjectId: projectId,
            backendProjectId: catalogApiProjectId,
            layoutCode: sess.layoutCode,
            apartmentId,
          });
          if (cancelled) return;
          returningVisitRef.current = ensured.returning;
          designCodeRef.current = ensured.designCode;
          setDesignCode(ensured.designCode);
        }

        setParams(
          {
            backendProjectId: catalogApiProjectId,
            layoutCode: sess.layoutCode,
            apartmentId,
            apartmentNumber: unitId,
          },
          { replace: true },
        );
      } catch (e: unknown) {
        if (cancelled) return;
        const message =
          e instanceof Error ? e.message : "Failed to load catalog";
        setSessionError(message);
      } finally {
        if (!cancelled) setSessionLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    journeyReady,
    projectId,
    catalogApiProjectId,
    layoutCode,
    apartmentId,
    viewOnly,
  ]);

  // Hydrate FE selections from storage only — never paint them onto UE
  useEffect(() => {
    if (!session || !designCode) return;
    if (viewOnly && design) {
      selections.hydrateFromDesign(design.configuration.selections);
      return;
    }
    if (!viewOnly) selections.hydrateFromStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, design, viewOnly, designCode]);

  useEffect(() => {
    if (
      !params.renders ||
      viewOnly ||
      !designCode ||
      !session
    ) {
      return;
    }
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
    if (frozenDesignOpen || resumedRendersRef.current) {
      return;
    }
    resumedRendersRef.current = true;
    setReviewOpen(false);
    renderJob.resume();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.renders, viewOnly, designCode, session, frozenDesignOpen, apartmentId, layoutCode, projectId, storageProjectId]);

  useEffect(() => {
    if (stream.isLoading || !session || !selections.hydrated) return;
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
  }, [
    stream.isLoading,
    session,
    selections.hydrated,
    projectId,
    viewOnly,
    designCode,
  ]);

  useEffect(() => {
    if (stream.isLoading) {
      appliedReadyRef.current = false;
      setSceneReady(false);
      invalidateUeSyncCache();
    }
  }, [stream.isLoading]);

  // URL layout_code change → LoadLevel (customization restored via LoadCustomization)
  useEffect(() => {
    if (stream.isLoading || !session || !selections.hydrated) return;
    const level = session.layoutCode || layoutCode;
    if (!level) return;

    if (loadedLevelRef.current == null) {
      loadedLevelRef.current = level;
      return;
    }
    if (loadedLevelRef.current === level) return;

    loadedLevelRef.current = level;
    void runUeSyncRef.current({ force: true });
  }, [layoutCode, stream.isLoading, session, selections.hydrated]);

  const zoneCameras = useMemo(() => {
    if (!activeZoneId || !session) return [];
    return camerasForZone(activeZoneId, sceneConfig);
  }, [activeZoneId, session, sceneConfig]);

  // URL is the view source of truth — keep top bar / panel in lockstep.
  useEffect(() => {
    if (!session) return;
    const cameraName = params.camera?.trim() || null;
    const urlZone = normalizeZone(params.zone);
    const rule = cameraName
      ? session.cameras.find((c) => c.name === cameraName)
      : null;
    const zoneId =
      (rule ? zoneIdForCamera(rule) : null) ??
      matchZoneId(urlZone) ??
      (cameraName ? zoneIdFromCamera({ name: cameraName }) : null);
    const zoneUe = zoneId ? (moveZoneName(zoneId) ?? zoneId) : null;

    if (zoneId) setActiveZoneId(zoneId);
    else setActiveZoneId(null);

    if (rule) {
      setActiveRule(rule);
      setActiveCameraKey(cameraKey(rule));
      setFreeCameraActive(false);
      freeModeRef.current = false;
    } else {
      setActiveRule(null);
      setActiveCameraKey(null);
      setFreeCameraActive(true);
      freeModeRef.current = true;
      setSidePanelOpen(false);
    }

    if (rule && zoneUe && urlZone !== zoneUe) {
      lastZoneInUrlRef.current = zoneUe;
      setParams({ zone: zoneUe, camera: rule.name }, { replace: true });
    } else if (zoneUe) {
      lastZoneInUrlRef.current = zoneUe;
    }
  }, [session, params.zone, params.camera, setParams]);

  const appliedPanelMap = useMemo(
    () => appliedSelectionMap(session?.defaults, selections.map),
    [session?.defaults, selections.map],
  );

  const dockSelections = useMemo(() => {
    if (!session) return [];
    const matById = new Map(session.materials.map((m) => [m.id, m]));
    const meshById = new Map(session.meshes.map((m) => [m.id, m]));
    return selections.selections.slice(-3).map((entry) => {
      const mat = matById.get(entry.materialId);
      const mesh = meshById.get(entry.meshId);
      return {
        slot: entry.slot,
        label: shortSurfaceLabel(session.slotLabels[entry.slot] ?? entry.slot),
        thumbnailUrl: mat?.thumbnailUrl ?? mesh?.thumbnailUrl ?? null,
      };
    });
  }, [session, selections.selections]);

  const panelMeshes = useMemo(() => {
    if (!activeRule) return [];
    return getMeshesForCamera(
      { name: activeRule.name, mode: activeRule.mode, index: activeRule.index },
      sceneConfig,
    );
  }, [activeRule, sceneConfig]);

  const getMaterials = useCallback(
    (meshId: string): MaterialOption[] => {
      if (!session) return [];
      const ids = session.materialsByMesh[meshId] ?? [];
      const byId = new Map(session.materials.map((m) => [m.id, m]));
      return ids.map((id) => byId.get(id) ?? { id, displayName: id });
    },
    [session],
  );

  const handleFreeCamera = useCallback(() => {
    const alreadyFree = freeModeRef.current && !cameraParamRef.current;
    ignoreUeZoneUntilRef.current = Date.now() + 1000;
    if (zoneEnterTimerRef.current != null) {
      window.clearTimeout(zoneEnterTimerRef.current);
      zoneEnterTimerRef.current = null;
    }
    freeModeRef.current = true;
    cameraParamRef.current = null;
    setFreeCameraActive(true);
    setSidePanelOpen(false);
    setActiveCameraKey(null);
    setActiveRule(null);
    cameraZone.setActiveCameraIndex(null);
    const zone =
      moveZoneName(activeZoneIdRef.current) ?? normalizeZone(params.zone);
    lastZoneInUrlRef.current = zone;
    setParams({ camera: null, zone }, { replace: true });
    if (!alreadyFree) void exitCameraOnUe(send, { mockLog: MOCK_UE });
  }, [cameraZone, setParams, send, params.zone]);

  const handleSelectCamera = useCallback(
    (rule: CameraRule, opts?: { edit?: boolean }) => {
      const isActive = activeCameraKey === cameraKey(rule);

      if (isActive) {
        if (opts?.edit) {
          setSidePanelOpen(true);
          setReviewOpen(false);
          setSelectionsOpen(false);
          return;
        }
        handleFreeCamera();
        return;
      }

      const zoneId = zoneIdForCamera(rule);
      const zoneUe = (zoneId ? moveZoneName(zoneId) : null) ?? zoneId;
      ignoreUeZoneUntilRef.current = Date.now() + 1000;
      if (zoneEnterTimerRef.current != null) {
        window.clearTimeout(zoneEnterTimerRef.current);
        zoneEnterTimerRef.current = null;
      }
      if (zoneId) setActiveZoneId(zoneId);
      lastZoneInUrlRef.current = zoneUe;
      cameraParamRef.current = rule.name;

      freeModeRef.current = false;
      setFreeCameraActive(false);
      setSidePanelOpen(true);
      setActiveRule(rule);
      setActiveCameraKey(cameraKey(rule));
      setParams(
        {
          camera: rule.name,
          zone: zoneUe,
        },
        { replace: true },
      );

      void switchCameraByNameOnUe(send, rule.name, { mockLog: MOCK_UE });
    },
    [activeCameraKey, setParams, send, handleFreeCamera],
  );

  const handleSelectZone = useCallback(
    (zoneId: string) => {
      if (!session) return;
      const enterName = moveZoneName(zoneId) ?? zoneId;
      const sameZone = activeZoneIdRef.current === zoneId;
      const wasLocked = Boolean(cameraParamRef.current);

      ignoreUeZoneUntilRef.current = Date.now() + 1000;
      if (zoneEnterTimerRef.current != null) {
        window.clearTimeout(zoneEnterTimerRef.current);
        zoneEnterTimerRef.current = null;
      }

      lastZoneInUrlRef.current = enterName;
      setActiveZoneId(zoneId);
      setSidePanelOpen(false);
      setFreeCameraActive(true);
      freeModeRef.current = true;
      setActiveRule(null);
      setActiveCameraKey(null);
      cameraParamRef.current = null;
      cameraZone.setActiveCameraIndex(null);
      setParams({ zone: enterName, camera: null }, { replace: true });

      if (sameZone) {
        if (wasLocked) void exitCameraOnUe(send, { mockLog: MOCK_UE });
        return;
      }

      if (wasLocked) {
        void (async () => {
          await exitCameraOnUe(send, { mockLog: MOCK_UE });
          await moveToZoneOnUe(send, enterName, { mockLog: MOCK_UE });
        })();
        return;
      }

      void moveToZoneOnUe(send, enterName, { mockLog: MOCK_UE });
    },
    [session, cameraZone, setParams, send],
  );

  const handleEditReviewSlot = useCallback(
    (slot: string) => {
      setReviewOpen(false);
      setQuoteDialogOpen(false);
      setSelectionsOpen(false);
      if (!session) {
        setSidePanelOpen(true);
        return;
      }
      const rule =
        session.cameras.find((c) => c.slot === slot) ??
        session.cameras.find((c) => c.name === slot);
      if (rule) handleSelectCamera(rule, { edit: true });
      else setSidePanelOpen(true);
    },
    [session, handleSelectCamera],
  );

  const handleShowMaterials = useCallback(() => {
    if (!session) return;
    freeModeRef.current = false;
    setFreeCameraActive(false);

    if (activeZoneId && activeRule) {
      setSidePanelOpen(true);
      return;
    }

    if (activeZoneId && zoneCameras[0]) {
      handleSelectCamera(zoneCameras[0]);
      return;
    }

    const fallbackZone = activeZoneId ?? session.zones[0]?.id;
    if (!activeZoneId && fallbackZone) {
      handleSelectZone(fallbackZone);
    }
    if (!fallbackZone) {
      setSidePanelOpen(true);
      return;
    }
    const first = camerasForZone(fallbackZone, sceneConfig)[0];
    if (first) handleSelectCamera(first);
    else setSidePanelOpen(true);
  }, [
    session,
    activeZoneId,
    activeRule,
    zoneCameras,
    sceneConfig,
    handleSelectCamera,
    handleSelectZone,
  ]);

  const handleSelectMesh = useCallback(
    (mesh: MeshOption) => {
      if (viewOnly) return;
      const slot = activeRule?.slot || activeRule?.name || mesh.slot || mesh.id;
      if (!slot) return;

      const mats = getMaterials(mesh.id);
      const current = appliedPanelMap[slot];
      if (current?.meshId === mesh.id) return;

      const materialId =
        mats.length === 0
          ? ""
          : (mats.find((item) => item.isDefault)?.id ?? mats[0]?.id ?? "");

      const entry: SelectionEntry = {
        slot,
        meshId: mesh.id,
        materialId,
        cameraId: activeRule?.name,
      };

      const token = selections.select(entry);
      if (!token) return;

      void applyOneSelectionToUe(send, entry, {
        mockLog: MOCK_UE,
        design_code: designCodeRef.current,
        onSaveStatus: selections.markSaveStatus,
        applyMaterial: shouldApplyMaterialToMesh(
          mesh.id,
          session?.materialsByMesh,
        ),
      }).then((ok) => {
        if (!selections.isCurrent(slot, token)) return;
        if (ok) selections.commitSlot(slot, entry, token);
        else selections.revertSlot(slot);
      });
    },
    [viewOnly, getMaterials, selections, activeRule, send, appliedPanelMap, session],
  );

  const handleRemoveSelection = useCallback(
    (slot: string) => {
      if (viewOnly) return;
      const token = selections.removeSlot(slot);
      if (!token) return;
      const fallback = session?.defaults?.find((d) => d.slot === slot);
      if (fallback) {
        void applyOneSelectionToUe(send, fallback, {
          mockLog: MOCK_UE,
          design_code: designCodeRef.current,
          onSaveStatus: selections.markSaveStatus,
          applyMaterial: shouldApplyMaterialToMesh(
            fallback.meshId,
            session?.materialsByMesh,
          ),
        }).then((ok) => {
          if (!selections.isCurrent(slot, token)) return;
          if (ok) selections.commitSlot(slot, null, token);
          else selections.revertSlot(slot);
        });
        return;
      }
      if (designCodeRef.current) {
        selections.markSaveStatus("saving");
        void saveCustomizationToUe(send, designCodeRef.current, {
          mockLog: MOCK_UE,
        }).then((ok) => {
          if (!selections.isCurrent(slot, token)) return;
          selections.markSaveStatus(ok ? "saved" : "failed");
          if (ok) selections.commitSlot(slot, null, token);
          else selections.revertSlot(slot);
        });
      }
    },
    [viewOnly, selections, session, send],
  );

  const handleLoadLevel = useCallback(
    (levelName: string) => {
      if (viewOnly) return;
      setParams({ layoutCode: levelName }, { replace: true });
    },
    [viewOnly, setParams],
  );

  const handleSelectMaterial = useCallback(
    (meshId: string, material: MaterialOption) => {
      if (viewOnly) return;
      const slot = activeRule?.slot || activeRule?.name || meshId;
      const current = appliedPanelMap[slot];
      if (
        current?.meshId === meshId &&
        (current.materialId || "") === material.id
      ) {
        return;
      }
      const entry: SelectionEntry = {
        slot,
        meshId,
        materialId: material.id,
        cameraId: activeRule?.name,
      };
      const token = selections.select(entry);
      if (!token) return;
      void applyOneSelectionToUe(send, entry, {
        mockLog: MOCK_UE,
        design_code: designCodeRef.current,
        onSaveStatus: selections.markSaveStatus,
        applyMaterial: shouldApplyMaterialToMesh(
          meshId,
          session?.materialsByMesh,
        ),
      }).then((ok) => {
        if (!selections.isCurrent(slot, token)) return;
        if (ok) selections.commitSlot(slot, entry, token);
        else selections.revertSlot(slot);
      });
    },
    [viewOnly, activeRule, selections, send, session, appliedPanelMap],
  );

  const handleOpenQuote = useCallback(() => {
    setSelectionsOpen(false);
    setSettingsOpen(false);
    setSidePanelOpen(false);
    if (!selections.selections.length) {
      setCustomizationRequiredOpen(true);
      return;
    }
    setQuoteDialogOpen(true);
  }, [selections.selections.length]);

  const handleReset = useCallback(() => {
    setResetDialogOpen(true);
  }, []);

  const confirmReset = useCallback(() => {
    setResetDialogOpen(false);
    selections.resetAll();
    invalidateUeSyncCache();
    void (async () => {
      selections.markSaveStatus("saving");
      const resetOk = await resetToDefaultOnUe(send, { mockLog: MOCK_UE });
      if (!resetOk) {
        selections.revertReset();
        selections.markSaveStatus("failed");
        return;
      }
      if (designCodeRef.current) {
        const ok = await saveCustomizationToUe(send, designCodeRef.current, {
          mockLog: MOCK_UE,
        });
        if (!ok) {
          selections.revertReset();
          selections.markSaveStatus("failed");
          return;
        }
        selections.commitReset();
        selections.markSaveStatus("saved");
      } else {
        selections.commitReset();
        selections.markSaveStatus("saved");
      }
      handleFreeCamera();
    })();
  }, [selections, send, handleFreeCamera]);

  const handleChangeResolution = useCallback(
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    (option: ResolutionOption) => {
      setCurrentResolution(option.label);
      const ui = stream.uiControlRef.current;
      try {
        if (option.width && option.height) {
          ui?.setResolution?.({
            width: option.width,
            height: option.height,
            label: option.label,
          });
        } else {
          ui?.setResolution?.({ label: option.label });
        }
      } catch (err) {
        console.warn("[Stream] setResolution failed", err);
      }
      setSettingsOpen(false);
    },
    [stream.uiControlRef],
  );

  const handleSubmit = useCallback(
    async (contact: { name: string; email: string; phone: string }) => {
      if (!session) return;
      setSubmitPending(true);
      setSubmitError(null);
      try {
        const result = await submitDesign({
          streamProjectId: projectId,
          unitId: unitId || "catalog",
          session,
          contact,
          configuration: {
            version: 1,
            levelName: session.layoutCode,
            selections: selections.selections,
            meta: { source: "submit" },
          },
        });
        selections.clearAfterSubmit();
        setSuccess(result);
        setSubmitOpen(false);
        setReviewOpen(false);
        finalDesign.backToCustomize();
        setParams(
          {
            layoutCode: session.layoutCode,
            unit: unitId,
            camera: params.camera,
            view: true,
            ...zoneUrlPatch(params.zone),
          },
          { replace: true },
        );
      } catch (e: any) {
        const msg =
          e instanceof ApiError ? e.message : (e?.message ?? "Submit failed");
        setSubmitError(msg);
      } finally {
        setSubmitPending(false);
      }
    },
    [
      session,
      unitId,
      projectId,
      params,
      selections,
      setParams,
      finalDesign.backToCustomize,
    ],
  );

  const handleStartOwn = useCallback(() => {
    setDesign(null);
    setSuccess(null);
    setParams({ view: false }, { replace: true });
    selections.resetAll();
    selections.commitReset();
  }, [setParams, selections]);

  const handleGoToProjects = useCallback(() => {
    allowUnloadRef.current = true;
    skipPopGuardRef.current = true;
    router.push("/projects");
  }, [router]);

  const handleContinueRendering = useCallback(() => {
    setFrozenDesignOpen(false);
    resumedRendersRef.current = true;
    returningVisitRef.current = true;
    if (!params.renders) {
      setParams({ renders: true }, { replace: true });
    }
    renderJob.resume();
    void runLoadThenCaptureHighRes();
  }, [params.renders, renderJob, runLoadThenCaptureHighRes, setParams]);

  const reloadWithoutRenders = useCallback(() => {
    allowUnloadRef.current = true;
    skipPopGuardRef.current = true;
    window.location.replace(locationWithoutRenders());
  }, []);

  const handleStartNewCustomization = useCallback(async () => {
    if (!session || !catalogApiProjectId) return;
    setFrozenDesignPending("new");
    try {
      resumedRendersRef.current = true;
      renderJob.reset();

      selections.resetAll();
      selections.commitReset();

      const layout = session.layoutCode || layoutCode;
      markFreshStartIntent(projectId, catalogApiProjectId, layout, apartmentId);
      clearDraft(projectId, catalogApiProjectId, layout, apartmentId);
      returningVisitRef.current = false;
      designCodeRef.current = "";
      invalidateUeSyncCache();
      reloadWithoutRenders();
    } catch (err) {
      console.warn("[design] replacement failed", err);
      setFrozenDesignPending(null);
    }
  }, [
    apartmentId,
    catalogApiProjectId,
    layoutCode,
    projectId,
    reloadWithoutRenders,
    renderJob,
    selections,
    session,
  ]);

  const handleKeepCustomization = useCallback(async () => {
    if (!session || !catalogApiProjectId) return;
    const source = designCodeRef.current?.trim();
    if (!source) return;
    setFrozenDesignPending("keep");
    try {
      resumedRendersRef.current = true;
      renderJob.reset();

      const fromMap = customMapToStored(session, selections.map);
      const fromDraft =
        loadDraft(
          projectId,
          catalogApiProjectId,
          session.layoutCode || layoutCode,
          apartmentId,
        )?.selections ?? [];

      const nextCode = await createReplacementDesign({
        streamProjectId: projectId,
        backendProjectId: catalogApiProjectId,
        layoutCode: session.layoutCode || layoutCode,
        apartmentId,
        sourceDesignCode: source,
        selections: fromMap.length ? fromMap : fromDraft,
      });
      returningVisitRef.current = true;
      designCodeRef.current = nextCode;
      invalidateUeSyncCache();

      if (nextCode) {
        const saved = await saveCustomizationToUe(send, nextCode, {
          mockLog: MOCK_UE,
        });
        if (!saved) {
          setFrozenDesignOpen(false);
          setFrozenDesignPending(null);
          setKeepCustomizationFailedOpen(true);
          return;
        }
      } else {
        setFrozenDesignOpen(false);
        setFrozenDesignPending(null);
        setKeepCustomizationFailedOpen(true);
        return;
      }
      reloadWithoutRenders();
    } catch (err) {
      console.warn("[design] keep customization failed", err);
      setFrozenDesignPending(null);
      setFrozenDesignOpen(false);
      setKeepCustomizationFailedOpen(true);
    }
  }, [
    apartmentId,
    catalogApiProjectId,
    layoutCode,
    projectId,
    reloadWithoutRenders,
    renderJob,
    selections.map,
    send,
    session,
  ]);

  const canReconnect =
    Boolean(projectId) &&
    isStreamProjectId(projectId, projectId) &&
    isBackendProjectId(catalogApiProjectId) &&
    Boolean((params.layoutCode || session?.layoutCode || "").trim()) &&
    !sessionError;

  const overlayKind = (() => {
    if (sessionError && !session) return "error" as const;
    if (stream.streamPhase === "disconnected" && !stream.hasEverBeenReady) {
      return "error" as const;
    }
    return streamOverlayKind({
      streamPhase: stream.streamPhase,
      queuePosition: stream.queuePosition,
      loadingTitle: stream.loadingTitle,
    });
  })();
  const streamBlocking =
    stream.isLoading ||
    overlayKind === "queue" ||
    overlayKind === "disconnected" ||
    overlayKind === "idle" ||
    overlayKind === "reconnecting" ||
    overlayKind === "error";
  const showStreamOverlay =
    overlayKind === "error" ||
    ((streamBlocking || sessionLoading || !sceneReady) &&
      !streamOverlayDismissed);
  const overlayProgress =
    overlayKind === "loading" || overlayKind === "reconnecting"
      ? Math.min(
          sceneReady ? 100 : 97,
          Math.max(
            sessionLoading ? 12 : 0,
            Math.min(stream.loadingProgress || 0, sceneReady ? 100 : 92),
            ueSyncStatus ? 96 : 0,
          ),
        )
      : stream.loadingProgress;
  const showAfkWarning =
    stream.afkWarning && !showStreamOverlay && overlayKind !== "idle";

  useEffect(() => {
    if (overlayKind !== "idle" && overlayKind !== "disconnected") return;
    if (overlayKind === "idle") setStreamOverlayDismissed(false);
    setQuoteDialogOpen(false);
    setSubmitOpen(false);
    setReviewOpen(false);
    setSelectionsOpen(false);
    setSettingsOpen(false);
    setBrowseStylesOpen(false);
  }, [overlayKind]);

  const reloadSession = useCallback(() => {
    allowUnloadRef.current = true;
    window.location.reload();
  }, []);

  const requestLeave = useCallback((target: "back" | string) => {
    pendingLeaveRef.current = target;
    setLeaveOpen(true);
  }, []);

  const stayOnConfigurator = useCallback(() => {
    pendingLeaveRef.current = null;
    setLeaveOpen(false);
  }, []);

  const confirmLeave = useCallback(() => {
    const target = pendingLeaveRef.current;
    allowUnloadRef.current = true;
    skipPopGuardRef.current = true;
    setLeaveOpen(false);
    if (typeof target === "string" && target) {
      window.location.assign(target);
    }
  }, []);

  useEffect(() => {
    if (leaveOpen) return;
    stayHrefRef.current = window.location.href;
  }, [
    leaveOpen,
    params.zone,
    params.camera,
    params.layoutCode,
    params.view,
    params.renders,
    params.apartmentId,
    params.apartmentNumber,
  ]);

  useEffect(() => {
    allowUnloadRef.current = false;
    skipPopGuardRef.current = false;
    stayHrefRef.current = window.location.href;

    const restoreStayHref = () => {
      const stay = stayHrefRef.current;
      if (!stay) return;
      window.history.pushState({ atelierLeaveGuard: true }, "", stay);
      try {
        const url = new URL(stay, window.location.origin);
        router.replace(`${url.pathname}${url.search}`, { scroll: false });
      } catch {
        /* keep pushState restore */
      }
    };

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (allowUnloadRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    const onPopState = () => {
      if (skipPopGuardRef.current || allowUnloadRef.current) return;
      const popped = window.location.href;
      const stay = stayHrefRef.current;
      if (!stay || popped === stay) return;
      restoreStayHref();
      requestLeave(popped);
    };
    window.addEventListener("popstate", onPopState, true);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("popstate", onPopState, true);
    };
  }, [requestLeave, router]);

  if (designError) {
    return (
      <div className="configurator-shell flex flex-col items-center justify-center gap-3 p-6 text-white">
        <p className="text-sm opacity-80">{designError}</p>
        <button
          type="button"
          className="rounded-lg bg-[#4e9cff] px-4 py-2 text-sm"
          onClick={handleStartOwn}
        >
          Start a new design
        </button>
      </div>
    );
  }

  const unitSubtitle = currentResidenceSubtitle();

  return (
    <div className="configurator-shell" ref={shellRef}>
      <StreamViewport ref={videoContainerRef} />
      <UeLogSidebar />

      {showStreamOverlay ? (
        <LoadingOverlay
          kind={overlayKind}
          progress={overlayProgress}
          unitSubtitle={unitSubtitle}
          queuePosition={stream.queuePosition}
          selectionCount={selections.selections.length}
          reconnectTitle={stream.loadingTitle}
          reconnectSubtitle={stream.loadingSubtitle}
          endedEyebrow={
            overlayKind === "error"
              ? sessionError
                ? "Unable to load"
                : "Unable to open"
              : stream.endedCopy.eyebrow
          }
          endedTitle={
            overlayKind === "error"
              ? sessionError
                ? "This apartment could not be loaded"
                : "The 3D session could not open"
              : stream.endedCopy.title
          }
          endedMessage={
            overlayKind === "error"
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
          onBackHome={() => {
            allowUnloadRef.current = true;
            skipPopGuardRef.current = true;
            router.push("/projects");
          }}
          onBrowseStyles={() => setBrowseStylesOpen(true)}
          progressLabel={
            overlayKind === "loading"
              ? ueSyncStatus || stream.loadingStatus || null
              : null
          }
          bootError={
            overlayKind === "loading" && ueSyncError ? ueSyncError : null
          }
          onRetryBoot={
            overlayKind === "loading" && ueSyncError
              ? () => {
                  setUeSyncError(null);
                  void runUeSyncRef.current({ force: true });
                }
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

      {ueSyncStatus && sceneReady && (
        <div className="cfg-sync-overlay" aria-live="polite">
          <p>{ueSyncStatus}</p>
        </div>
      )}

      {ueSyncError && !showStreamOverlay && (
        <div className="cfg-sync-error">
          <p>{ueSyncError}</p>
          <button
            type="button"
            className="cfg-primary-btn"
            onClick={() => {
              setUeSyncError(null);
              void runUeSyncRef.current({ force: true });
            }}
          >
            Re-apply finishes
          </button>
        </div>
      )}

      {showAfkWarning ? (
        <AfkWarningOverlay
          countdown={stream.afkCountdown}
          total={AFK_CONFIG.countdownSeconds}
          onStay={stream.dismissAfk}
        />
      ) : null}

      {viewOnly && designCode && (
        <ViewOnlyBanner designCode={designCode} onStartOwn={handleStartOwn} />
      )}

      {selections.storageWarning && !viewOnly && (
        <div className="absolute left-4 top-16 z-30 max-w-xs rounded-lg bg-amber-900/80 px-3 py-2 text-xs text-amber-50">
          {selections.storageWarning}
        </div>
      )}

      {sceneReady && session && (
        <div inert={showAfkWarning ? true : undefined}>
          <ZoneTopBar
            zones={session.zones}
            activeZoneId={activeZoneId}
            freeCameraActive={freeCameraActive}
            onSelectZone={handleSelectZone}
            onFreeCamera={handleFreeCamera}
            cameras={zoneCameras}
            activeCameraKey={activeCameraKey}
            onSelectCamera={handleSelectCamera}
          />

          {sidePanelOpen && activeZoneId && !freeCameraActive && (
            <ZoneSidePanel
              cameras={zoneCameras}
              activeCameraKey={activeCameraKey}
              onSelectCamera={handleSelectCamera}
              meshes={panelMeshes}
              selectionMap={appliedPanelMap}
              onSelectMesh={handleSelectMesh}
              getMaterials={getMaterials}
              onSelectMaterial={handleSelectMaterial}
              onRemoveSelection={handleRemoveSelection}
              defaults={session.defaults}
              viewOnly={viewOnly}
              onClose={() => setSidePanelOpen(false)}
            />
          )}

          <ConfiguratorDock
            saveStatus={
              viewOnly
                ? "saved"
                : selections.saveStatus === "idle"
                  ? "saved"
                  : selections.saveStatus
            }
            selectionsOpen={selectionsOpen}
            onToggleSelections={() => setSelectionsOpen((v) => !v)}
            onReset={handleReset}
            onFullscreen={stream.requestFullscreen}
            settingsOpen={settingsOpen}
            onToggleSettings={() => setSettingsOpen((v) => !v)}
            currentResolution={currentResolution}
            onChangeResolution={handleChangeResolution}
            resolutionEnabled={stream.resolutionEnabled}
            viewOnly={viewOnly}
            materialsOpen={sidePanelOpen && !freeCameraActive}
            onShowMaterials={handleShowMaterials}
            onQuote={handleOpenQuote}
            selectedItems={dockSelections}
            levels={[]}
            activeLevel={session.layoutCode}
            onLoadLevel={handleLoadLevel}
          />

          <SelectionsSheet
            open={selectionsOpen}
            selections={selections.selections}
            session={session}
            slotLabels={session.slotLabels}
            onClose={() => setSelectionsOpen(false)}
            onRemove={handleRemoveSelection}
            onEdit={handleEditReviewSlot}
            viewOnly={viewOnly}
          />
        </div>
      )}

      <SubmitModal
        open={submitOpen}
        pending={submitPending}
        error={submitError}
        onClose={() => setSubmitOpen(false)}
        onSubmit={handleSubmit}
      />

      <QuotationReady
        open={quotationReady || Boolean(success)}
        designCode={success?.designCode ?? designCode ?? ""}
        shareUrl={
          success?.shareUrl ??
          (typeof window !== "undefined"
            ? `${window.location.origin}${window.location.pathname}?${new URLSearchParams(
                {
                  ...(catalogApiProjectId
                    ? { project_id: catalogApiProjectId }
                    : {}),
                  layout_code: layoutCode,
                  ...(apartmentId ? { apartment_id: apartmentId } : {}),
                  ...(unitId ? { apartment_number: unitId } : {}),
                },
              ).toString()}`
            : "")
        }
        unitSubtitle={unitSubtitle}
        email={readJourney()?.customer.email}
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
            open={rendersNotReadyOpen}
            onClose={() => setRendersNotReadyOpen(false)}
          />

          <ReviewSelections
            open={reviewOpen && !viewOnly && !renderJob.active}
            session={session}
            selections={selections.selections}
            unitId={unitId}
            unitSubtitle={unitSubtitle}
            summary={designSummary.data}
            summaryLoading={designSummary.loading}
            summaryError={designSummary.error}
            confirmPending={renderJob.preparing}
            confirmError={renderJob.active ? null : renderJob.error}
            actionsDisabled={
              streamBlocking &&
              overlayKind !== "disconnected" &&
              overlayKind !== "idle"
            }
            streamOffline={
              overlayKind === "disconnected" || overlayKind === "idle"
            }
            onReconnect={canReconnect ? reloadSession : undefined}
            onBack={() => {
              setReviewOpen(false);
              setQuoteDialogOpen(false);
            }}
            onConfirm={async () => {
              const ok = await renderJob.start();
              if (!ok) return;
              resumedRendersRef.current = true;
              setQuoteDialogOpen(false);
              setSubmitOpen(false);
              setReviewOpen(false);
              setParams({ renders: true }, { replace: true });
              void runLoadThenCaptureHighRes();
            }}
            onRemove={handleRemoveSelection}
            onEdit={handleEditReviewSlot}
          />

          <FinalDesignProgress
            open={
              !viewOnly &&
              !quotationReady &&
              !frozenDesignOpen &&
              (renderJob.active || Boolean(params.renders))
            }
            rooms={renderJob.rooms}
            unitSubtitle={unitSubtitle}
            error={renderJob.error}
            total={renderJob.totalAmount}
            onConfirm={() => {
              if (!renderJob.allReady) {
                setRendersNotReadyOpen(true);
                return;
              }
              clearDraft(
                projectId,
                storageProjectId,
                session.layoutCode || layoutCode,
                apartmentId,
              );
              renderJob.stop();
              setParams({ renders: false }, { replace: true });
              setQuotationReady(true);
            }}
            onBack={() => {
              renderJob.stop();
              setParams({ renders: false }, { replace: true });
              resumedRendersRef.current = false;
              setReviewOpen(true);
            }}
            onView={renderJob.openViewer}
            onRetry={renderJob.retryRoom}
            onSubmit={handleSubmit}
          />

          <FinalDesignViewer
            stills={renderJob.stills}
            index={renderJob.lightboxIndex}
            onIndexChange={renderJob.setLightboxIndex}
            onClose={renderJob.closeViewer}
          />
        </>
      ) : null}

      <ResetToDefaultDialog
        open={resetDialogOpen}
        onCancel={() => setResetDialogOpen(false)}
        onConfirm={confirmReset}
      />

      <FrozenDesignDialog
        open={frozenDesignOpen && !viewOnly && !keepCustomizationFailedOpen}
        pending={frozenDesignPending}
        showContinueRendering={frozenFromRenders}
        onContinueRendering={handleContinueRendering}
        onKeep={() => {
          void handleKeepCustomization();
        }}
        onStartNew={() => {
          void handleStartNewCustomization();
        }}
        onGoToProjects={handleGoToProjects}
      />

      <KeepCustomizationFailedDialog
        open={keepCustomizationFailedOpen && !viewOnly}
        pending={frozenDesignPending === "new"}
        onStartNew={() => {
          void handleStartNewCustomization();
        }}
      />

      <LeaveConfiguratorDialog
        open={leaveOpen}
        onStay={stayOnConfigurator}
        onLeave={confirmLeave}
      />

      {journeyReady === false ? (
        <JourneyGate onReady={() => setJourneyReady(true)} />
      ) : null}
    </div>
  );
};

export default ConfiguratorShell;
