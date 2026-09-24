"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  exitCameraOnUe,
  moveToZoneOnUe,
  switchCameraByNameOnUe,
} from "@/lib/configurator/apply-ue";
import { getMeshesForCamera } from "@/lib/configurator/mesh-rules";
import { normalizeZone } from "@/lib/configurator/url-params";
import {
  cameraKey,
  camerasForZone,
  matchZoneId,
  moveZoneName,
  zoneIdForCamera,
  zoneIdFromCamera,
} from "@/lib/configurator/zone-catalog";
import { extractCameraZoneFromResponse } from "@/lib/stream-pixel/parse-ue-response";
import type { UeInteractionPayload } from "@/lib/stream-pixel/ue-protocol";
import type {
  CameraRule,
  ConfiguratorCamera,
  ConfiguratorSession,
  MeshRulesConfig,
  ShareableConfiguratorParams,
} from "@/types/configurator";

type SetParams = (
  patch: Partial<ShareableConfiguratorParams>,
  options?: { replace?: boolean },
) => void;

type Args = {
  session: ConfiguratorSession | null;
  sceneConfig: MeshRulesConfig;
  zoneParam: string | null | undefined;
  cameraParam: string | null | undefined;
  setParams: SetParams;
  viewOnly: boolean;
  send: (payload: UeInteractionPayload) => boolean;
  /** Close review / quote / selections before editing a slot. */
  onEnterEdit: () => void;
};

/**
 * Zone + camera navigation. The URL (zone, camera) is the view source of
 * truth; fixed cameras are FE-owned, free roam follows UE zone-enter events.
 */
export function useCatalogNavigation({
  session,
  sceneConfig,
  zoneParam,
  cameraParam,
  setParams,
  viewOnly,
  send,
  onEnterEdit,
}: Args) {
  const [activeZoneId, setActiveZoneId] = useState<string | null>(() =>
    matchZoneId(zoneParam),
  );
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [freeCameraActive, setFreeCameraActive] = useState(() => !cameraParam);
  const [activeCameraKey, setActiveCameraKey] = useState<string | null>(null);
  const [activeRule, setActiveRule] = useState<CameraRule | null>(null);

  const lastZoneInUrlRef = useRef<string | null>(zoneParam ?? null);
  const freeModeRef = useRef(true);
  const cameraParamRef = useRef<string | null>(cameraParam ?? null);
  const ignoreUeZoneUntilRef = useRef(0);
  const zoneEnterTimerRef = useRef<number | null>(null);
  const activeZoneIdRef = useRef<string | null>(activeZoneId);

  useEffect(() => {
    cameraParamRef.current = cameraParam ?? null;
  }, [cameraParam]);

  useEffect(() => {
    activeZoneIdRef.current = activeZoneId;
  }, [activeZoneId]);

  useEffect(
    () => () => {
      if (zoneEnterTimerRef.current != null) {
        window.clearTimeout(zoneEnterTimerRef.current);
      }
    },
    [],
  );

  const clearZoneEnterTimer = () => {
    if (zoneEnterTimerRef.current != null) {
      window.clearTimeout(zoneEnterTimerRef.current);
      zoneEnterTimerRef.current = null;
    }
  };

  /** UE zone-enter during free roam → URL zone (debounced). */
  const handleUeZoneEvent = useCallback(
    (response: unknown) => {
      const data = extractCameraZoneFromResponse(response);
      if (!data) return;
      if (Date.now() < ignoreUeZoneUntilRef.current) return;
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
    [setParams],
  );

  /** Seed panel state from the URL before a UE sync and mute zone echoes. */
  const prepareViewForSync = useCallback(() => {
    ignoreUeZoneUntilRef.current = Date.now() + 6000;
    const zone = normalizeZone(zoneParam);
    const camera = cameraParam ?? null;

    if (camera && session) {
      const rule = session.cameras.find((c) => c.name === camera);
      const camObj: ConfiguratorCamera = rule
        ? { name: rule.name, index: Number(rule.index ?? 0), mode: rule.mode }
        : { name: camera, index: 0 };
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
    return { zone, camera };
  }, [cameraParam, session, zoneParam]);

  // URL is the view source of truth — keep top bar / panel in lockstep.
  useEffect(() => {
    if (!session) return;
    const cameraName = cameraParam?.trim() || null;
    const urlZone = normalizeZone(zoneParam);
    const rule = cameraName
      ? session.cameras.find((c) => c.name === cameraName)
      : null;
    const zoneId =
      (rule ? zoneIdForCamera(rule) : null) ??
      matchZoneId(urlZone) ??
      (cameraName ? zoneIdFromCamera({ name: cameraName }) : null);
    const zoneUe = zoneId ? (moveZoneName(zoneId) ?? zoneId) : null;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- mirrors external URL state
    setActiveZoneId(zoneId ?? null);

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
  }, [session, zoneParam, cameraParam, setParams]);

  const zoneCameras = useMemo(() => {
    if (!activeZoneId || !session) return [];
    return camerasForZone(activeZoneId, sceneConfig);
  }, [activeZoneId, session, sceneConfig]);

  const panelMeshes = useMemo(() => {
    if (!activeRule) return [];
    return getMeshesForCamera(
      { name: activeRule.name, mode: activeRule.mode, index: activeRule.index },
      sceneConfig,
    );
  }, [activeRule, sceneConfig]);

  const handleFreeCamera = useCallback(() => {
    const alreadyFree = freeModeRef.current && !cameraParamRef.current;
    ignoreUeZoneUntilRef.current = Date.now() + 1000;
    clearZoneEnterTimer();
    freeModeRef.current = true;
    cameraParamRef.current = null;
    setFreeCameraActive(true);
    setSidePanelOpen(false);
    setActiveCameraKey(null);
    setActiveRule(null);
    const zone =
      moveZoneName(activeZoneIdRef.current) ?? normalizeZone(zoneParam);
    lastZoneInUrlRef.current = zone;
    setParams({ camera: null, zone }, { replace: true });
    if (!alreadyFree) void exitCameraOnUe(send);
  }, [setParams, send, zoneParam]);

  const handleSelectCamera = useCallback(
    (rule: CameraRule, opts?: { edit?: boolean }) => {
      const isActive = activeCameraKey === cameraKey(rule);

      if (isActive) {
        if (opts?.edit) {
          setSidePanelOpen(true);
          onEnterEdit();
          return;
        }
        handleFreeCamera();
        return;
      }

      const zoneId = zoneIdForCamera(rule);
      const zoneUe = (zoneId ? moveZoneName(zoneId) : null) ?? zoneId;
      ignoreUeZoneUntilRef.current = Date.now() + 1000;
      clearZoneEnterTimer();
      if (zoneId) setActiveZoneId(zoneId);
      lastZoneInUrlRef.current = zoneUe;
      cameraParamRef.current = rule.name;

      freeModeRef.current = false;
      setFreeCameraActive(false);
      setSidePanelOpen(!viewOnly);
      setActiveRule(rule);
      setActiveCameraKey(cameraKey(rule));
      setParams({ camera: rule.name, zone: zoneUe }, { replace: true });

      void switchCameraByNameOnUe(send, rule.name);
    },
    [activeCameraKey, setParams, send, handleFreeCamera, viewOnly, onEnterEdit],
  );

  const handleSelectZone = useCallback(
    (zoneId: string) => {
      if (!session) return;
      const enterName = moveZoneName(zoneId) ?? zoneId;
      const sameZone = activeZoneIdRef.current === zoneId;
      const wasLocked = Boolean(cameraParamRef.current);

      ignoreUeZoneUntilRef.current = Date.now() + 1000;
      clearZoneEnterTimer();

      lastZoneInUrlRef.current = enterName;
      setActiveZoneId(zoneId);
      setSidePanelOpen(false);
      setFreeCameraActive(true);
      freeModeRef.current = true;
      setActiveRule(null);
      setActiveCameraKey(null);
      cameraParamRef.current = null;
      setParams({ zone: enterName, camera: null }, { replace: true });

      if (sameZone) {
        if (wasLocked) void exitCameraOnUe(send);
        return;
      }

      if (wasLocked) {
        void (async () => {
          await exitCameraOnUe(send);
          await moveToZoneOnUe(send, enterName);
        })();
        return;
      }

      void moveToZoneOnUe(send, enterName);
    },
    [session, setParams, send],
  );

  const handleEditReviewSlot = useCallback(
    (slot: string) => {
      onEnterEdit();
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
    [session, handleSelectCamera, onEnterEdit],
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

  return {
    activeZoneId,
    activeRule,
    activeCameraKey,
    freeCameraActive,
    sidePanelOpen,
    setSidePanelOpen,
    zoneCameras,
    panelMeshes,
    handleUeZoneEvent,
    prepareViewForSync,
    handleFreeCamera,
    handleSelectCamera,
    handleSelectZone,
    handleEditReviewSlot,
    handleShowMaterials,
  };
}
