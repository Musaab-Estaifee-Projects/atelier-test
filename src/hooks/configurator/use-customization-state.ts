"use client";

import { useCallback, useState } from "react";

/**
 * Local selection memory (which mesh/material is active per camera).
 * This is UI state only — source of truth after save is UE + your backend design code.
 */
export function useCustomizationState() {
  const [activeMeshByCameraKey, setActiveMeshByCameraKey] = useState<
    Record<string, string>
  >({});
  const [activeMaterialByMeshId, setActiveMaterialByMeshId] = useState<
    Record<string, string>
  >({});

  const setMeshForCamera = useCallback((cameraKey: string, meshId: string) => {
    setActiveMeshByCameraKey((prev) => ({ ...prev, [cameraKey]: meshId }));
  }, []);

  const setMaterialForMesh = useCallback(
    (meshId: string, materialId: string) => {
      setActiveMaterialByMeshId((prev) => ({ ...prev, [meshId]: materialId }));
    },
    [],
  );

  return {
    activeMeshByCameraKey,
    activeMaterialByMeshId,
    setMeshForCamera,
    setMaterialForMesh,
  };
}
