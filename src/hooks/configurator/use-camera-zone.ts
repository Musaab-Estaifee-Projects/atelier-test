"use client";

import { useCallback, useRef, useState } from "react";
import type { ConfiguratorCamera, MeshRulesConfig } from "@/types/configurator";
import { extractCameraZoneFromResponse } from "@/lib/stream-pixel/parse-ue-response";

function mergeCameraDisplayNames(
  cameras: ConfiguratorCamera[],
  sceneConfig: MeshRulesConfig,
): ConfiguratorCamera[] {
  const byIndex = new Map(
    (sceneConfig.cameras || [])
      .filter((c) => c.index !== undefined && c.index !== null)
      .map((c) => [Number(c.index), c]),
  );
  const byName = new Map((sceneConfig.cameras || []).map((c) => [c.name, c]));

  return cameras.map((camera) => {
    const override = byIndex.get(camera.index) ?? byName.get(camera.name);
    if (!override) return camera;
    return {
      ...camera,
      name: override.name ?? camera.name,
      mode: override.mode ?? camera.mode,
    };
  });
}

export function useCameraZone(sceneConfig: MeshRulesConfig) {
  const [cameraZone, setCameraZone] = useState<string | null>(null);
  const [zoneCameras, setZoneCameras] = useState<ConfiguratorCamera[]>([]);
  const [activeCameraIndex, setActiveCameraIndex] = useState<number | null>(
    null,
  );
  const [showCameraPanel, setShowCameraPanel] = useState(true);
  const userClosedCameraPanelRef = useRef(false);
  /** When true, ignore UE zone-exit so share restore is not wiped mid-flight. */
  const suppressZoneExitRef = useRef(false);
  const sceneConfigRef = useRef(sceneConfig);
  // eslint-disable-next-line react-hooks/refs
  sceneConfigRef.current = sceneConfig;

  const applyCameraZoneUpdate = useCallback((response: unknown): boolean => {
    const data = extractCameraZoneFromResponse(response);
    if (!data) return false;

    if (data.event === "enter" || data.cameras.length > 0) {
      const displayCameras = mergeCameraDisplayNames(
        data.cameras,
        sceneConfigRef.current,
      );
      setCameraZone(data.zone);
      setZoneCameras(displayCameras);
      if (!userClosedCameraPanelRef.current) setShowCameraPanel(true);
      if (displayCameras.length > 0) {
        // Preserve an explicit share/active index when possible
        setActiveCameraIndex((prev) => {
          if (prev != null && displayCameras.some((c) => c.index === prev)) {
            return prev;
          }
          return prev ?? displayCameras[0].index;
        });
      }
    }

    if (data.event === "exit") {
      if (suppressZoneExitRef.current) return true;
      setCameraZone(null);
      setZoneCameras([]);
      setActiveCameraIndex(null);
    }
    return true;
  }, []);

  /** Seed zone UI from a shared URL when UE has not fired a zone enter yet. */
  const hydrateFromShare = useCallback(
    (opts: {
      zone?: string | null;
      cameras: ConfiguratorCamera[];
      activeIndex: number | null;
    }) => {
      const displayCameras = mergeCameraDisplayNames(
        opts.cameras,
        sceneConfigRef.current,
      );
      if (opts.zone != null && opts.zone !== "") {
        setCameraZone(opts.zone);
      }
      if (displayCameras.length > 0) {
        setZoneCameras(displayCameras);
      }
      if (opts.activeIndex != null) {
        setActiveCameraIndex(opts.activeIndex);
      }
      if (!userClosedCameraPanelRef.current) {
        setShowCameraPanel(true);
      }
    },
    [],
  );

  return {
    cameraZone,
    zoneCameras,
    activeCameraIndex,
    setActiveCameraIndex,
    showCameraPanel,
    setShowCameraPanel,
    userClosedCameraPanelRef,
    suppressZoneExitRef,
    applyCameraZoneUpdate,
    hydrateFromShare,
  };
}
