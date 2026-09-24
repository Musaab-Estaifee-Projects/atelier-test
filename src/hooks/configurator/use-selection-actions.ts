"use client";

import { useCallback, useMemo } from "react";
import {
  applyOneSelectionToUe,
  resetToDefaultOnUe,
  saveCustomizationToUe,
  shouldApplyMaterialToMesh,
} from "@/lib/configurator/apply-ue";
import { appliedSelectionMap } from "@/lib/configurator/storage";
import { invalidateUeSyncCache } from "@/lib/configurator/sync-to-ue";
import { shortSurfaceLabel } from "@/lib/configurator/zone-catalog";
import type { UeInteractionPayload } from "@/lib/stream-pixel/ue-protocol";
import type { useSelectionMap } from "@/hooks/configurator/use-selection-map";
import type {
  CameraRule,
  ConfiguratorSession,
  MaterialOption,
  MeshOption,
  SelectionEntry,
} from "@/types/configurator";

type Args = {
  session: ConfiguratorSession | null;
  selections: ReturnType<typeof useSelectionMap>;
  activeRule: CameraRule | null;
  viewOnly: boolean;
  send: (payload: UeInteractionPayload) => boolean;
  designCodeRef: React.RefObject<string | null>;
  onResetDone: () => void;
};

/**
 * Optimistic finish picks: update the FE map, paint + SaveCustomization on UE,
 * then commit or revert the slot based on the UE ack.
 */
export function useSelectionActions({
  session,
  selections,
  activeRule,
  viewOnly,
  send,
  designCodeRef,
  onResetDone,
}: Args) {
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

  const getMaterials = useCallback(
    (meshId: string): MaterialOption[] => {
      if (!session) return [];
      const ids = session.materialsByMesh[meshId] ?? [];
      const byId = new Map(session.materials.map((m) => [m.id, m]));
      return ids.map((id) => byId.get(id) ?? { id, displayName: id });
    },
    [session],
  );

  const applyEntry = useCallback(
    (slot: string, entry: SelectionEntry, token: number) => {
      void applyOneSelectionToUe(send, entry, {
        design_code: designCodeRef.current,
        onSaveStatus: selections.markSaveStatus,
        applyMaterial: shouldApplyMaterialToMesh(
          entry.meshId,
          session?.materialsByMesh,
        ),
      }).then((ok) => {
        if (!selections.isCurrent(slot, token)) return;
        if (ok) selections.commitSlot(slot, entry, token);
        else selections.revertSlot(slot);
      });
    },
    [designCodeRef, selections, send, session?.materialsByMesh],
  );

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
      applyEntry(slot, entry, token);
    },
    [viewOnly, getMaterials, selections, activeRule, appliedPanelMap, applyEntry],
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
      applyEntry(slot, entry, token);
    },
    [viewOnly, activeRule, selections, appliedPanelMap, applyEntry],
  );

  const handleRemoveSelection = useCallback(
    (slot: string) => {
      if (viewOnly) return;
      const token = selections.removeSlot(slot);
      if (!token) return;
      const fallback = session?.defaults?.find((d) => d.slot === slot);
      if (fallback) {
        void applyOneSelectionToUe(send, fallback, {
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
        void saveCustomizationToUe(send, designCodeRef.current).then((ok) => {
          if (!selections.isCurrent(slot, token)) return;
          selections.markSaveStatus(ok ? "saved" : "failed");
          if (ok) selections.commitSlot(slot, null, token);
          else selections.revertSlot(slot);
        });
      }
    },
    [viewOnly, selections, session, send, designCodeRef],
  );

  const confirmReset = useCallback(() => {
    selections.resetAll();
    invalidateUeSyncCache();
    void (async () => {
      selections.markSaveStatus("saving");
      const resetOk = await resetToDefaultOnUe(send);
      if (!resetOk) {
        selections.revertReset();
        selections.markSaveStatus("failed");
        return;
      }
      if (designCodeRef.current) {
        const ok = await saveCustomizationToUe(send, designCodeRef.current);
        if (!ok) {
          selections.revertReset();
          selections.markSaveStatus("failed");
          return;
        }
      }
      selections.commitReset();
      selections.markSaveStatus("saved");
      onResetDone();
    })();
  }, [selections, send, designCodeRef, onResetDone]);

  return {
    appliedPanelMap,
    dockSelections,
    getMaterials,
    handleSelectMesh,
    handleSelectMaterial,
    handleRemoveSelection,
    confirmReset,
  };
}
