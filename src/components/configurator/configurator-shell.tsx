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
  resetCustomizationOnUe,
  restoreCameraZoneToUe,
  revertSlotOnUe,
} from "@/lib/configurator/apply-ue";
import {
  invalidateUeSyncCache,
  syncDraftToUe,
} from "@/lib/configurator/sync-to-ue";
import { getMeshesForCamera } from "@/lib/configurator/mesh-rules";
import { getMaterialsForMesh } from "@/lib/configurator/materials";
import { loadDraft, saveUeLoadId } from "@/lib/configurator/storage";
import { normalizeZone, zoneUrlPatch } from "@/lib/configurator/url-params";
import {
  camerasForZone,
  matchZoneId,
  moveZoneName,
  shortSurfaceLabel,
  ueZoneName,
  zoneCamerasForUi,
  zoneIdFromCamera,
} from "@/lib/configurator/zone-catalog";
import { materialThumb } from "@/lib/configurator/chrome";
import { slotFromMeshId } from "@/mocks/configurator/session";
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
} from "@/lib/stream-pixel/parse-ue-response";
import { noteUeLoadId } from "@/lib/configurator/ue-load-id";
import { reviewUnitSubtitle } from "@/lib/configurator/review-selections";
import { useFinalDesign } from "@/hooks/configurator/use-final-design";
import StreamViewport from "./stream-viewport";
import LoadingOverlay, { streamOverlayKind } from "./loading-overlay";
import AfkWarningOverlay from "./afk-warning-overlay";
import QuotationDialog from "./quotation-dialog";
import ZoneTopBar from "./zone-top-bar";
import ZoneSidePanel, { cameraKey } from "./zone-side-panel";
import ConfiguratorDock from "./configurator-dock";
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

const MOCK_UE =
  process.env.NEXT_PUBLIC_MOCK_UE === "true" ||
  process.env.NEXT_PUBLIC_STREAMPIXEL_MOCK === "true";

function resolveLiveIndex(
  rule: CameraRule,
  live: ConfiguratorCamera[],
): number | null {
  // Prefer mock/session index so zone bar works without waiting for UE
  if (rule.index != null && !Number.isNaN(Number(rule.index))) {
    return Number(rule.index);
  }
  const hit = live.find(
    (c) =>
      c.name === rule.name &&
      (!rule.mode ||
        !c.mode ||
        c.mode === rule.mode ||
        c.mode.includes(rule.mode)),
  );
  if (hit?.index != null) return Number(hit.index);
  const byName = live.find((c) => c.name === rule.name);
  return byName?.index != null ? Number(byName.index) : null;
}

export default function ConfiguratorShell({
  projectId,
}: {
  projectId: string;
}) {
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const { params, setParams } = useShareableParams(projectId);
  const viewOnly = Boolean(params.designCode);
  const unitId = params.unit?.trim() || null;

  const [session, setSession] = useState<ConfiguratorSession | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [design, setDesign] = useState<StoredDesign | null>(null);
  const [designError, setDesignError] = useState<string | null>(null);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [streamOverlayDismissed, setStreamOverlayDismissed] = useState(false);
  const [browseStylesOpen, setBrowseStylesOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitPending, setSubmitPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SubmitDesignResult | null>(null);
  const [ueSyncStatus, setUeSyncStatus] = useState<string | null>(null);
  const [ueSyncError, setUeSyncError] = useState<string | null>(null);
  const [ueSyncNonce, setUeSyncNonce] = useState(0);

  const [activeZoneId, setActiveZoneId] = useState<string | null>(() =>
    matchZoneId(params.zone),
  );
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [freeCameraActive, setFreeCameraActive] = useState(
    () => params.camera == null,
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
    unitId,
    session,
    viewOnly,
  });

  const handleUeResponse = useCallback(
    (response: unknown) => {
      const custom = extractCustomizationEvent(response);
      if (custom?.loadId) {
        noteUeLoadId(custom.loadId);
        if (unitId) saveUeLoadId(projectId, unitId, custom.loadId);
      }
      ingestRenderRef.current(response);
      if (capturePhaseRef.current === "capturing") return;
      cameraZone.applyCameraZoneUpdate(response);
      const data = extractCameraZoneFromResponse(response);
      if (!data || viewOnly) return;

      if (data.event === "exit") {
        freeModeRef.current = true;
        setFreeCameraActive(true);
        setActiveCameraKey(null);
        setActiveRule(null);
        setSidePanelOpen(false);
        setParams({ camera: null }, { replace: true });
        return;
      }

      const z = normalizeZone(data.zone);
      if (z && z !== lastZoneInUrlRef.current) {
        lastZoneInUrlRef.current = z;
        setParams({ ...zoneUrlPatch(z) }, { replace: true });
      }
      const zid = matchZoneId(z) ?? zoneIdFromCamera(data.cameras[0]);
      if (zid) {
        // Keep Kitchen chip when UE reports LivingArea (same volume)
        const keepKitchen =
          !freeModeRef.current &&
          activeZoneIdRef.current === "Kitchen" &&
          zid === "LivingArea";
        if (!keepKitchen) setActiveZoneId(zid);
      }

      // Free roam into a zone: highlight zone chip; panel stays closed
      if (freeModeRef.current) {
        setFreeCameraActive(true);
        setSidePanelOpen(false);
      } else {
        setFreeCameraActive(false);
      }
    },
    [cameraZone, setParams, viewOnly, unitId, projectId],
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
      if (MOCK_UE) {
        console.info("[mock UE]", payload);
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
    async (opts?: {
      force?: boolean;
      skipLoadLevel?: boolean;
      forceLoadLevel?: boolean;
    }) => {
      if (!session) return;
      if (viewOnly && !design) return;

      const finishes =
        viewOnly && design
          ? design.configuration.selections
          : unitId
            ? (loadDraft(projectId, unitId)?.selections ?? [])
            : [];
      const hasFinishes = finishes.length > 0;

      setUeSyncError(null);
      if (hasFinishes) {
        setUeSyncStatus("Applying finishes…");
      }

      const zone = normalizeZone(params.zone);
      const camera = params.camera ?? null;
      const levelName = params.level || session.levelName;
      const defaultBoot = "2BHK_Type_2_Updated";

      if (camera != null) {
        const rule = session.cameras.find(
          (c) => c.index !== undefined && Number(c.index) === Number(camera),
        );
        const camObj: ConfiguratorCamera = rule
          ? { name: rule.name, index: Number(rule.index), mode: rule.mode }
          : { name: `Camera ${camera}`, index: camera };
        cameraZone.hydrateFromShare({
          zone,
          cameras: [camObj],
          activeIndex: camera,
        });
        const zid = matchZoneId(zone) ?? zoneIdFromCamera(camObj);
        if (zid) setActiveZoneId(zid);
      } else if (zone) {
        const zid = matchZoneId(zone);
        if (zid) setActiveZoneId(zid);
      }

      try {
        const ok = await syncDraftToUe({
          send,
          isUeReady,
          streamProjectId: projectId,
          unitId,
          levelName,
          zone,
          camera,
          designSelections:
            viewOnly && design ? design.configuration.selections : null,
          // Stream usually boots into 2BHK — only LoadLevel when URL asks for another plan
          skipLoadLevel:
            opts?.skipLoadLevel ??
            (!opts?.forceLoadLevel && levelName === defaultBoot),
          forceLoadLevel: opts?.forceLoadLevel,
          force: opts?.force,
          mockLog: MOCK_UE,
          onProgress: (msg) => {
            if (hasFinishes) setUeSyncStatus(msg);
          },
        });

        if (ok || !hasFinishes) {
          appliedReadyRef.current = true;
          loadedLevelRef.current = levelName;
          setUeSyncStatus(null);
          setUeSyncError(null);
        } else {
          appliedReadyRef.current = false;
          setUeSyncStatus(null);
          setUeSyncError(
            "Could not apply all finishes. Retry when the stream is ready.",
          );
        }
      } catch {
        setUeSyncStatus(null);
        if (hasFinishes) {
          setUeSyncError("Sync failed. Retry when the stream is ready.");
        } else {
          setUeSyncError(null);
          appliedReadyRef.current = true;
        }
      }
    },
    [
      session,
      viewOnly,
      design,
      params.zone,
      params.camera,
      params.level,
      cameraZone,
      send,
      isUeReady,
      projectId,
      unitId,
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

      if (!unitId && !params.designCode) {
        setSessionError(
          "Missing ?unit= in the URL. Example: ?unit=LO-APT-2BHK-T02",
        );
        setSessionLoading(false);
        return;
      }

      try {
        if (params.designCode) {
          const stored = await getDesign(params.designCode);
          if (cancelled) return;
          setDesign(stored);
          const unit = stored.unitId || unitId || "LO-APT-2BHK-T02";
          const sess = await getConfiguratorSession({
            unitId: unit,
            streamProjectId: projectId,
            levelName: params.level || stored.configuration.levelName,
          });
          if (cancelled) return;
          setSession(sess);
          if (!params.unit) {
            setParams(
              { unit, level: stored.configuration.levelName },
              { replace: true },
            );
          }
        } else if (unitId) {
          const sess = await getConfiguratorSession({
            unitId,
            streamProjectId: projectId,
            levelName: params.level || undefined,
          });
          if (cancelled) return;
          setSession(sess);
          if (!params.level) {
            setParams({ level: sess.levelName }, { replace: true });
          }
        }
      } catch (e: any) {
        if (cancelled) return;
        if (params.designCode) {
          setDesignError(e?.message ?? "Invalid design code");
        } else {
          setSessionError(e?.message ?? "Failed to load session");
        }
      } finally {
        if (!cancelled) setSessionLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, unitId, params.designCode]);

  // Hydrate selections after session ready — then force UE apply when draft exists
  useEffect(() => {
    if (!session) return;
    if (viewOnly && design) {
      selections.hydrateFromDesign(design.configuration.selections);
      return;
    }
    if (!viewOnly && unitId) {
      selections.hydrateFromStorage();
      const draft = loadDraft(projectId, unitId);
      if (draft?.selections?.length) {
        console.info(
          `[Configurator] localStorage has ${draft.selections.length} selection(s) — will apply to UE`,
          draft.selections,
        );
        // Ensure sync effect re-runs after hydrate even if stream already ready
        appliedReadyRef.current = false;
        setUeSyncNonce((n) => n + 1);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, design, viewOnly, unitId]);

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
    unitId,
    viewOnly,
    designReady,
    params.designCode,
    ueSyncNonce,
  ]);

  useEffect(() => {
    if (stream.isLoading) {
      appliedReadyRef.current = false;
      invalidateUeSyncCache();
    }
  }, [stream.isLoading]);

  // URL ?level= change → LoadLevel + re-apply localStorage finishes
  useEffect(() => {
    if (stream.isLoading || !session || !selections.hydrated) return;
    const level = params.level || session.levelName;
    if (!level) return;

    if (loadedLevelRef.current == null) {
      // First boot handled by runUeSync (LoadLevel when not default 2BHK)
      loadedLevelRef.current = level;
      return;
    }
    if (loadedLevelRef.current === level) return;

    let cancelled = false;
    loadedLevelRef.current = level;
    setUeSyncStatus(`Loading ${level}…`);

    void (async () => {
      send({ Function: "LoadLevel", LevelName: level });
      await new Promise((r) => window.setTimeout(r, 2200));
      if (cancelled) return;
      await runUeSyncRef.current({ force: true, skipLoadLevel: true });
    })();

    return () => {
      cancelled = true;
    };
  }, [params.level, stream.isLoading, session, selections.hydrated, send]);

  const zoneCameras = useMemo(() => {
    if (!activeZoneId || !session) return [];
    return camerasForZone(activeZoneId, sceneConfig);
  }, [activeZoneId, session, sceneConfig]);

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
      if (!session) return getMaterialsForMesh(meshId);
      const ids = session.materialsByMesh[meshId] ?? [];
      if (!ids.length) return getMaterialsForMesh(meshId);
      const byId = new Map(session.materials.map((m) => [m.id, m]));
      return ids.map((id) => byId.get(id) ?? { id, displayName: id });
    },
    [session],
  );

  const handleSelectZone = useCallback(
    (zoneId: string) => {
      if (!session) return;

      setActiveZoneId(zoneId);
      setSidePanelOpen(false);
      setFreeCameraActive(false);
      freeModeRef.current = false;

      const enterName = moveZoneName(zoneId) ?? ueZoneName(zoneId);
      const mockCams = zoneCamerasForUi(zoneId, sceneConfig);
      const rules = camerasForZone(zoneId, sceneConfig);
      const first = rules[0] ?? null;

      // Seed from mock mesh-rules so cameras + meshes work immediately (like before)
      cameraZone.hydrateFromShare({
        zone: enterName,
        cameras: mockCams,
        activeIndex: first?.index != null ? Number(first.index) : null,
      });
      zoneCamerasRef.current = mockCams;

      lastZoneInUrlRef.current = zoneId;
      setParams(
        {
          ...zoneUrlPatch(zoneId),
          camera: first?.index != null ? Number(first.index) : null,
        },
        { replace: true },
      );

      send({ Function: "MoveToZone", ZoneName: enterName });
      send({ Function: "EnterZone", ZoneName: enterName });
      send({ Function: "GoToZone", ZoneName: enterName });

      if (first) {
        setActiveRule(first);
        setActiveCameraKey(cameraKey(first));
        const idx = Number(first.index);
        if (!Number.isNaN(idx)) {
          cameraZone.setActiveCameraIndex(idx);
          send({
            Function: "SwitchCameraByIndex",
            Index: idx,
            ZoneName: enterName,
          });
        }
      } else {
        setActiveRule(null);
        setActiveCameraKey(null);
      }
    },
    [session, sceneConfig, cameraZone, setParams, send],
  );

  const handleFreeCamera = useCallback(() => {
    freeModeRef.current = true;
    setFreeCameraActive(true);
    setSidePanelOpen(false);
    setActiveCameraKey(null);
    setActiveRule(null);
    cameraZone.setActiveCameraIndex(null);
    setParams({ camera: null }, { replace: true });
    send({ Function: "ExitCamera" });
  }, [cameraZone, setParams, send]);

  const handleSelectCamera = useCallback(
    (rule: CameraRule) => {
      freeModeRef.current = false;
      setFreeCameraActive(false);
      setSidePanelOpen(true);
      setActiveRule(rule);
      setActiveCameraKey(cameraKey(rule));

      const idx = resolveLiveIndex(rule, zoneCamerasRef.current);
      const zoneId =
        activeZoneId ??
        matchZoneId(params.zone) ??
        zoneIdFromCamera({ name: rule.name, mode: rule.mode });
      const zone = moveZoneName(zoneId) ?? normalizeZone(params.zone);

      if (idx != null) {
        cameraZone.setActiveCameraIndex(idx);
        setParams(
          { camera: idx, ...zoneUrlPatch(activeZoneId ?? zone) },
          { replace: true },
        );
        if (zone) {
          send({ Function: "MoveToZone", ZoneName: zone });
          send({ Function: "EnterZone", ZoneName: zone });
        }
        send({
          Function: "SwitchCameraByIndex",
          Index: idx,
          ...(zone ? { ZoneName: zone } : {}),
        });
      } else {
        console.warn("[Configurator] camera has no mock index", rule);
        send({
          Function: "SwitchCameraByName",
          CameraName: rule.name,
          ...(rule.mode ? { Mode: rule.mode } : {}),
        });
      }
    },
    [params.zone, activeZoneId, cameraZone, setParams, send],
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

    const fallbackZone = activeZoneId ?? "LivingArea";
    if (!activeZoneId) {
      handleSelectZone(fallbackZone);
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
      const slot = mesh.slot || slotFromMeshId(mesh.id);
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
        cameraIndex:
          activeRule?.index != null ? Number(activeRule.index) : undefined,
      };

      if (!selections.select(entry)) return;

      void applyOneSelectionToUe(send, entry, {
        mockLog: MOCK_UE,
        skipMove: true,
        unitId,
        streamProjectId: projectId,
      });
    },
    [viewOnly, getMaterials, selections, activeRule, send, unitId, projectId],
  );

  const handleRemoveSelection = useCallback(
    (slot: string) => {
      if (viewOnly) return;
      selections.removeSlot(slot);
      invalidateUeSyncCache();
      if (!session) return;
      const remaining = (
        (unitId ? loadDraft(projectId, unitId)?.selections : null) ??
        selections.selections
      ).filter((s) => s.slot !== slot);
      void revertSlotOnUe(send, session, slot, remaining, {
        mockLog: MOCK_UE,
        zone: normalizeZone(params.zone),
        camera: params.camera ?? null,
        unitId,
        streamProjectId: projectId,
      });
    },
    [
      viewOnly,
      selections,
      session,
      send,
      params.zone,
      params.camera,
      unitId,
      projectId,
    ],
  );

  const handleLoadLevel = useCallback(
    (levelName: string) => {
      if (viewOnly) return;
      setParams({ level: levelName }, { replace: true });
    },
    [viewOnly, setParams],
  );

  const handleSelectMaterial = useCallback(
    (meshId: string, material: MaterialOption) => {
      if (viewOnly) return;
      const slot = slotFromMeshId(meshId);
      const entry: SelectionEntry = {
        slot,
        meshId,
        materialId: material.id,
        cameraId: activeRule?.name,
        cameraIndex:
          activeRule?.index != null ? Number(activeRule.index) : undefined,
      };
      if (!selections.select(entry)) return;
      void applyOneSelectionToUe(send, entry, {
        mockLog: MOCK_UE,
        skipMove: true,
        unitId,
        streamProjectId: projectId,
      });
    },
    [viewOnly, activeRule, selections, send, unitId, projectId],
  );

  const handleReset = useCallback(() => {
    selections.resetAll();
    invalidateUeSyncCache();
    void (async () => {
      await resetCustomizationOnUe(send, { mockLog: MOCK_UE });
      await restoreCameraZoneToUe(send, {
        zone: normalizeZone(params.zone),
        camera: params.camera ?? null,
        mockLog: MOCK_UE,
      });
    })();
  }, [selections, send, params.zone, params.camera]);

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
      if (!session || !unitId) return;
      setSubmitPending(true);
      setSubmitError(null);
      try {
        const result = await submitDesign({
          streamProjectId: projectId,
          unitId,
          session,
          contact,
          configuration: {
            version: 1,
            levelName: params.level || session.levelName,
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
            level: params.level || session.levelName,
            unit: unitId,
            camera: params.camera,
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
    setParams({ designCode: null }, { replace: true });
    selections.resetAll();
  }, [setParams, selections]);

  const displayPrice = viewOnly
    ? (design?.price ?? selections.optimisticPrice)
    : selections.optimisticPrice;

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
            params.level || session?.levelName,
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
            window.location.assign("/");
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
              setUeSyncNonce((n) => n + 1);
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
            activeZoneId={activeZoneId}
            freeCameraActive={freeCameraActive}
            onSelectZone={(zoneId) => {
              if (zoneId === activeZoneId && !freeCameraActive) {
                handleFreeCamera();
                return;
              }
              handleSelectZone(zoneId);
            }}
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
              selectionMap={selections.map}
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
                  ? selections.selections.length
                    ? "saved"
                    : "unsaved"
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
            onQuote={() => {
              setSelectionsOpen(false);
              setSettingsOpen(false);
              setSidePanelOpen(false);
              setQuoteDialogOpen(true);
            }}
            selectedItems={dockSelections}
            levels={[]}
            activeLevel={params.level || session.levelName}
            onLoadLevel={handleLoadLevel}
          />

          <SelectionsSheet
            open={selectionsOpen}
            selections={selections.selections}
            slotLabels={session.slotLabels}
            price={displayPrice}
            onClose={() => setSelectionsOpen(false)}
            onSubmit={() => {
              setSelectionsOpen(false);
              setReviewOpen(true);
            }}
            onRemove={handleRemoveSelection}
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
          <ReviewSelections
            open={reviewOpen && !viewOnly}
            session={session}
            selections={selections.selections}
            unitId={unitId}
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
          />
          <FinalDesignPrompt
            open={finalDesign.phase === "confirm"}
            onBack={finalDesign.backToCustomize}
            onStart={finalDesign.startCapture}
          />
          <FinalDesignProgress
            open={finalDesign.phase === "capturing"}
            rooms={finalDesign.rooms}
            unitSubtitle={reviewUnitSubtitle(
              unitId,
              params.level || session.levelName,
            )}
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
              finalDesign.backToCustomize();
              setReviewOpen(true);
            }}
          />
        </>
      ) : null}
    </div>
  );
}
