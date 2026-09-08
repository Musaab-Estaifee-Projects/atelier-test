/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/refs */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import "@/app/configurator/configurator.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ApiError,
  getConfiguratorSession,
  getDesign,
  submitDesign,
} from "@/lib/configurator/api";
import {
  applyOneSelectionToUe,
  exitCameraOnUe,
  moveToZoneOnUe,
  resetToDefaultOnUe,
  saveCustomizationToUe,
  switchCameraByNameOnUe,
} from "@/lib/configurator/apply-ue";
import {
  invalidateUeSyncCache,
  syncDraftToUe,
} from "@/lib/configurator/sync-to-ue";
import { getMeshesForCamera } from "@/lib/configurator/mesh-rules";
import { ensureDesignCode, appliedSelectionMap } from "@/lib/configurator/storage";
import { normalizeZone, zoneUrlPatch } from "@/lib/configurator/url-params";
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
import { materialThumb } from "@/lib/configurator/chrome";
import {
  DEMO_BACKEND_PROJECT_ID,
  DEFAULT_LAYOUT_CODE,
} from "@/lib/projects/catalog";
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
import { noteUeAck, noteUeLoadId, noteCustomizationResult } from "@/lib/configurator/ue-load-id";
import { reviewUnitSubtitle } from "@/lib/configurator/review-selections";
import { useFinalDesign } from "@/hooks/configurator/use-final-design";
import StreamViewport from "./stream-viewport";
import LoadingOverlay, { streamOverlayKind } from "./loading-overlay";
import AfkWarningOverlay from "./afk-warning-overlay";
import QuotationDialog from "./quotation-dialog";
import ZoneTopBar from "./zone-top-bar";
import ZoneSidePanel from "./zone-side-panel";
import ConfiguratorDock from "./configurator-dock";
import CustomizationRequiredDialog from "./customization-required-dialog";
import ResetToDefaultDialog from "./reset-to-default-dialog";
import SelectionsSheet from "./selections-sheet";
import SubmitModal from "./submit-modal";
import DesignSuccess from "./design-success";
import ViewOnlyBanner from "./view-only-banner";
import FinalDesignPrompt from "./final-design/final-design-prompt";
import FinalDesignProgress from "./final-design/final-design-progress";
import FinalDesignViewer from "./final-design/final-design-viewer";
import FinalDesignReview from "./final-design/final-design-review";
import ReviewSelections from "./review-selections";
import SelectStyle from "@/components/pages/styles/select-style";
import { redirect } from "next/navigation";

const MOCK_UE =
  process.env.NEXT_PUBLIC_MOCK_UE === "true" ||
  process.env.NEXT_PUBLIC_STREAMPIXEL_MOCK === "true";

const ConfiguratorShell = ({ projectId }: { projectId: string }) => {
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const { params, setParams } = useShareableParams(projectId);
  const viewOnly = Boolean(params.view);
  const unitId = params.unit?.trim() || null;
  const backendProjectId =
    params.backendProjectId?.trim() || DEMO_BACKEND_PROJECT_ID;
  const layoutCode = params.layoutCode?.trim() || DEFAULT_LAYOUT_CODE;

  const returningVisitRef = useRef(false);
  const designCodeRef = useRef<string | null>(params.designCode ?? null);
  const [designCode, setDesignCode] = useState<string | null>(
    params.designCode ?? null,
  );

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
  const [ueSyncStatus, setUeSyncStatus] = useState<string | null>(null);
  const [ueSyncError, setUeSyncError] = useState<string | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

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
  const [currentResolution, setCurrentResolution] =
    useState("Auto (Dashboard)");

  const appliedReadyRef = useRef(false);
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
    backendProjectId,
    layoutCode,
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
      }

      const ack = extractUeCommandAck(response);
      if (ack) noteUeAck(ack);

      const custom = extractCustomizationEvent(response);
      if (custom?.kind === "saved") selections.markSaveStatus("saved");
      if (custom?.kind === "error" && custom.op !== "load") {
        selections.markSaveStatus("failed");
      }
      if (custom?.kind === "loaded" || custom?.kind === "error") {
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
        matchZoneId(data.zone) ?? zoneIdFromCamera(data.cameras[0] ?? undefined);
      const zoneUe = zid ? (moveZoneName(zid) ?? zid) : normalizeZone(data.zone);
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
    [cameraZone, selections, setParams],
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
    designCode,
  });
  ingestRenderRef.current = finalDesign.ingestUeResponse;
  capturePhaseRef.current = finalDesign.phase;

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
    async (opts?: { force?: boolean; skipLoadLevel?: boolean }) => {
      if (!session) return;
      if (viewOnly && !design) return;

      const code = designCodeRef.current;
      setUeSyncError(null);
      if (returningVisitRef.current && code) {
        setUeSyncStatus("Loading saved customization…");
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
        const ok = await syncDraftToUe({
          send,
          isUeReady,
          layoutCode: levelName,
          designCode: code,
          returningVisit: returningVisitRef.current,
          selections: selections.selections,
          defaults: session.defaults,
          zone,
          camera: camera ?? null,
          skipLoadLevel: opts?.skipLoadLevel,
          force: opts?.force,
          mockLog: MOCK_UE,
          onProgress: (msg) => setUeSyncStatus(msg),
        });

        if (ok) {
          appliedReadyRef.current = true;
          loadedLevelRef.current = levelName;
          setUeSyncStatus(null);
          setUeSyncError(null);
        } else {
          appliedReadyRef.current = false;
          setUeSyncStatus(null);
          setUeSyncError("Could not restore the stream. Retry when ready.");
        }
      } catch {
        setUeSyncStatus(null);
        setUeSyncError("Sync failed. Retry when the stream is ready.");
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

  // Boot session / design
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setSessionLoading(true);
      setSessionError(null);
      setDesignError(null);

      try {
        if (viewOnly && params.designCode) {
          try {
            const stored = await getDesign(params.designCode);
            if (cancelled) return;
            setDesign(stored);
          } catch {
            /* view-only share is optional; catalog still loads */
          }
        }

        const sess = await getConfiguratorSession({
          streamProjectId: projectId,
          backendProjectId,
          layoutCode,
          unitId,
        });
        if (cancelled) return;
        setActiveCatalogZones(sess.zones);
        setSession(sess);

        const ensured = ensureDesignCode({
          streamProjectId: projectId,
          projectId: backendProjectId,
          layoutCode: sess.layoutCode,
          urlDesignCode: params.designCode,
        });
        returningVisitRef.current = ensured.returning;
        designCodeRef.current = ensured.designCode;
        setDesignCode(ensured.designCode);

        setParams(
          {
            backendProjectId: sess.backendProjectId,
            layoutCode: sess.layoutCode,
            designCode: ensured.designCode,
            unit: unitId,
          },
          { replace: true },
        );
      } catch (e: any) {
        if (cancelled) return;
        setSessionError(e?.message ?? "Failed to load catalog");
      } finally {
        if (!cancelled) setSessionLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, backendProjectId, layoutCode, viewOnly]);

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

  const designReady = Boolean(design);

  useEffect(() => {
    if (stream.isLoading || !session || !selections.hydrated) return;
    if (viewOnly && !designReady) return;

    // Also runs after reconnect: isLoading true invalidates the UE cache,
    // then this effect force-syncs finishes/camera when the stream is live again.
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      void runUeSyncRef.current({ force: true });
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
    designReady,
    params.designCode,
    designCode,
  ]);

  useEffect(() => {
    if (stream.isLoading) {
      appliedReadyRef.current = false;
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
    const byId = new Map(session.materials.map((m) => [m.id, m]));
    return selections.selections.slice(-3).map((entry) => {
      const mat = byId.get(entry.materialId);
      return {
        slot: entry.slot,
        label: shortSurfaceLabel(session.slotLabels[entry.slot] ?? entry.slot),
        thumbnailUrl: materialThumb(entry.materialId, mat?.thumbnailUrl),
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
    (rule: CameraRule) => {
      const isActive = activeCameraKey === cameraKey(rule);
      if (isActive) {
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
      const sameZone = activeZoneIdRef.current === zoneId;
      const lockedInZone = sameZone && Boolean(cameraParamRef.current);
      if (lockedInZone) {
        handleFreeCamera();
        return;
      }

      const cams = camerasForZone(zoneId, sceneConfig);
      const target = cams[0];
      if (target) {
        handleSelectCamera(target);
        return;
      }

      ignoreUeZoneUntilRef.current = Date.now() + 1000;
      const enterName = moveZoneName(zoneId) ?? zoneId;
      lastZoneInUrlRef.current = enterName;
      cameraParamRef.current = null;
      setActiveZoneId(zoneId);
      setSidePanelOpen(false);
      setFreeCameraActive(true);
      freeModeRef.current = true;
      setActiveRule(null);
      setActiveCameraKey(null);
      cameraZone.setActiveCameraIndex(null);
      setParams({ zone: enterName, camera: null }, { replace: true });
      void exitCameraOnUe(send, { mockLog: MOCK_UE });
    },
    [session, sceneConfig, cameraZone, setParams, send, handleFreeCamera, handleSelectCamera],
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
      if (rule) handleSelectCamera(rule);
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
      const prevMat = selections.map[slot]?.materialId;
      const materialId =
        mats.length === 0
          ? ""
          : ((prevMat && mats.some((m) => m.id === prevMat)
              ? prevMat
              : mats[0]?.id) ?? "");

      const entry: SelectionEntry = {
        slot,
        meshId: mesh.id,
        materialId,
        cameraId: activeRule?.name,
      };

      if (!selections.select(entry)) return;

      void applyOneSelectionToUe(send, entry, {
        mockLog: MOCK_UE,
        designCode: designCodeRef.current,
        onSaveStatus: selections.markSaveStatus,
      });
    },
    [viewOnly, getMaterials, selections, activeRule, send],
  );

  const handleRemoveSelection = useCallback(
    (slot: string) => {
      if (viewOnly) return;
      selections.removeSlot(slot);
      const fallback = session?.defaults?.find((d) => d.slot === slot);
      if (fallback) {
        void applyOneSelectionToUe(send, fallback, {
          mockLog: MOCK_UE,
          designCode: designCodeRef.current,
          onSaveStatus: selections.markSaveStatus,
        });
        return;
      }
      if (designCodeRef.current) {
        selections.markSaveStatus("saving");
        void saveCustomizationToUe(send, designCodeRef.current, {
          mockLog: MOCK_UE,
        }).then((ok) => selections.markSaveStatus(ok ? "saved" : "failed"));
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
      const entry: SelectionEntry = {
        slot,
        meshId,
        materialId: material.id,
        cameraId: activeRule?.name,
      };
      if (!selections.select(entry)) return;
      void applyOneSelectionToUe(send, entry, {
        mockLog: MOCK_UE,
        designCode: designCodeRef.current,
        onSaveStatus: selections.markSaveStatus,
      });
    },
    [viewOnly, activeRule, selections, send, session],
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
      await resetToDefaultOnUe(send, { mockLog: MOCK_UE });
      if (designCodeRef.current) {
        const ok = await saveCustomizationToUe(send, designCodeRef.current, {
          mockLog: MOCK_UE,
        });
        selections.markSaveStatus(ok ? "saved" : "failed");
      } else {
        selections.markSaveStatus("saved");
      }
      const zone = moveZoneName(activeZoneId) ?? normalizeZone(params.zone);
      if (zone) await moveToZoneOnUe(send, zone, { mockLog: MOCK_UE });
      handleFreeCamera();
    })();
  }, [selections, send, params.zone, activeZoneId, handleFreeCamera]);

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
            designCode: result.designCode,
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
  }, [setParams, selections]);

  const overlayKind = streamOverlayKind({
    streamPhase: stream.streamPhase,
    queuePosition: stream.queuePosition,
    loadingTitle: stream.loadingTitle,
  });
  const streamBlocking =
    stream.isLoading ||
    overlayKind === "queue" ||
    overlayKind === "disconnected" ||
    overlayKind === "idle" ||
    overlayKind === "reconnecting";
  const showStreamOverlay =
    (streamBlocking || sessionLoading) && !streamOverlayDismissed;
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

  if (sessionError && !session) {
    return (
      <div className="configurator-shell flex flex-col items-center justify-center gap-3 p-6 text-white">
        <p className="text-sm opacity-80">{sessionError}</p>
        <button
          type="button"
          className="rounded-lg bg-white/10 px-4 py-2 text-sm"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="configurator-shell" ref={shellRef}>
      <StreamViewport ref={videoContainerRef} />

      {showStreamOverlay ? (
        <LoadingOverlay
          kind={overlayKind}
          progress={
            overlayKind === "loading" || overlayKind === "reconnecting"
              ? Math.max(sessionLoading ? 12 : 0, stream.loadingProgress || 0)
              : stream.loadingProgress
          }
          unitSubtitle={reviewUnitSubtitle(
            unitId,
            params.layoutCode || session?.layoutCode,
          )}
          queuePosition={stream.queuePosition}
          selectionCount={selections.selections.length}
          reconnectTitle={stream.loadingTitle}
          reconnectSubtitle={stream.loadingSubtitle}
          endedEyebrow={stream.endedCopy.eyebrow}
          endedTitle={stream.endedCopy.title}
          onReconnect={() => window.location.reload()}
          onContinueToSummary={() => {
            setStreamOverlayDismissed(true);
            setQuoteDialogOpen(false);
            setReviewOpen(true);
          }}
          onBackHome={() => {
            // window.location.assign("/");
            redirect("/");
          }}
          onBrowseStyles={() => setBrowseStylesOpen(true)}
        />
      ) : null}

      {browseStylesOpen ? (
        <SelectStyle
          overlay
          onStartCustomizing={() => setBrowseStylesOpen(false)}
          onSelectStyle={() => setBrowseStylesOpen(false)}
        />
      ) : null}

      {ueSyncStatus && !stream.isLoading && (
        <div className="cfg-sync-overlay" aria-live="polite">
          <p>{ueSyncStatus}</p>
        </div>
      )}

      {ueSyncError && !stream.isLoading && (
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
          onStay={stream.dismissAfk}
        />
      ) : null}

      {viewOnly && params.designCode && (
        <ViewOnlyBanner
          designCode={params.designCode}
          onStartOwn={handleStartOwn}
        />
      )}

      {selections.storageWarning && !viewOnly && (
        <div className="absolute left-4 top-16 z-30 max-w-xs rounded-lg bg-amber-900/80 px-3 py-2 text-xs text-amber-50">
          {selections.storageWarning}
        </div>
      )}

      {!stream.isLoading && session && (
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
            onEdit={(slot) => {
              setSelectionsOpen(false);
              handleEditReviewSlot(slot);
            }}
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

      <DesignSuccess
        open={Boolean(success)}
        designCode={success?.designCode ?? ""}
        shareUrl={success?.shareUrl ?? ""}
        price={success?.price ?? 0}
        currency={success?.currency}
        onClose={() => setSuccess(null)}
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

          <ReviewSelections
            open={reviewOpen && !viewOnly}
            session={session}
            selections={selections.selections}
            unitId={unitId}
            actionsDisabled={streamBlocking}
            onBack={() => {
              setReviewOpen(false);
              setQuoteDialogOpen(false);
            }}
            onConfirm={() => {
              setReviewOpen(false);
              setQuoteDialogOpen(false);
              setSubmitOpen(false);
              finalDesign.startCapture();
            }}
            onRemove={handleRemoveSelection}
            onEdit={handleEditReviewSlot}
          />

          <FinalDesignPrompt
            open={finalDesign.phase === "confirm"}
            onBack={finalDesign.backToCustomize}
            onStart={finalDesign.startCapture}
          />

          <FinalDesignProgress
            open={finalDesign.phase === "capturing"}
            rooms={finalDesign.rooms}
            unitSubtitle={reviewUnitSubtitle(unitId, session.layoutCode)}
            error={finalDesign.globalError}
            submitPending={submitPending}
            submitError={submitError}
            onBack={() => {
              finalDesign.backToCustomize();
              setReviewOpen(true);
            }}
            onView={finalDesign.openViewer}
            onRetry={finalDesign.retryRoom}
            onSubmit={handleSubmit}
          />

          <FinalDesignViewer
            key={finalDesign.viewerRoom?.zoneId ?? "none"}
            room={finalDesign.viewerRoom}
            onClose={finalDesign.closeViewer}
          />

          <FinalDesignReview
            open={finalDesign.phase === "review"}
            rooms={finalDesign.rooms}
            session={session}
            selections={selections.selections}
            onBack={finalDesign.backToCustomize}
            onQuote={() => {
              if (!selections.selections.length) {
                setCustomizationRequiredOpen(true);
                return;
              }
              finalDesign.backToCustomize();
              setReviewOpen(true);
            }}
          />
        </>
      ) : null}

      <ResetToDefaultDialog
        open={resetDialogOpen}
        onCancel={() => setResetDialogOpen(false)}
        onConfirm={confirmReset}
      />
    </div>
  );
};

export default ConfiguratorShell;
