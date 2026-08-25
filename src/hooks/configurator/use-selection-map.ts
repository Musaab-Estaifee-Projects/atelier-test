"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { estimatePriceFromSession } from "@/lib/configurator/pricing";
import {
  clearDraft,
  ensureCustomizationRef,
  isUsingMemoryOnlyStorage,
  loadDraft,
  mapToSelections,
  saveDraft,
  selectionsToMap,
} from "@/lib/configurator/storage";
import type {
  ConfiguratorSession,
  SelectionEntry,
  SelectionMap,
} from "@/types/configurator";

type SaveStatus = "idle" | "saving" | "saved" | "unsaved";

/**
 * EDIT-mode FE map + localStorage persistence (selections only).
 * Camera/zone are never stored — URL only.
 */
export function useSelectionMap(args: {
  streamProjectId: string;
  unitId: string | null;
  session: ConfiguratorSession | null;
  viewOnly: boolean;
}) {
  const { streamProjectId, unitId, session, viewOnly } = args;
  const [map, setMap] = useState<SelectionMap>({});
  const [hydrated, setHydrated] = useState(false);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const hydratedKeyRef = useRef<string | null>(null);

  const hydrateFromStorage = useCallback(() => {
    if (viewOnly || !unitId || !session) return;
    const key = `${streamProjectId}:${unitId}`;
    if (hydratedKeyRef.current === key) {
      setHydrated(true);
      return;
    }
    hydratedKeyRef.current = key;

    const draft = loadDraft(streamProjectId, unitId);
    if (!draft) {
      setMap({});
      setSaveStatus("unsaved");
      setHydrated(true);
      return;
    }

    const meshOk = new Set(session.meshes.map((m) => m.id));
    const matOk = new Set(session.materials.map((m) => m.id));
    const cleaned = draft.selections.filter(
      (s) => meshOk.has(s.meshId) && (!s.materialId || matOk.has(s.materialId)),
    );
    setMap(selectionsToMap(cleaned));
    setSaveStatus(cleaned.length ? "saved" : "unsaved");
    setHydrated(true);
    if (isUsingMemoryOnlyStorage()) {
      setStorageWarning(
        "Browser storage unavailable — edits stay in this tab only.",
      );
    }
  }, [streamProjectId, unitId, session, viewOnly]);

  const hydrateFromDesign = useCallback(
    (selections: SelectionEntry[]) => {
      hydratedKeyRef.current = `view:${streamProjectId}`;
      if (!session) {
        setMap(selectionsToMap(selections));
        setHydrated(true);
        return;
      }
      const meshOk = new Set(session.meshes.map((m) => m.id));
      const matOk = new Set(session.materials.map((m) => m.id));
      const cleaned = selections.filter(
        (s) =>
          meshOk.has(s.meshId) && (!s.materialId || matOk.has(s.materialId)),
      );
      setMap(selectionsToMap(cleaned));
      setSaveStatus("saved");
      setHydrated(true);
    },
    [session, streamProjectId],
  );

  const persist = useCallback(
    (next: SelectionMap) => {
      if (viewOnly || !unitId || !session) return;
      setSaveStatus("saving");
      const ueLoadId = ensureCustomizationRef(
        streamProjectId,
        unitId,
        session.levelName,
      );
      const draft = {
        version: 1 as const,
        streamProjectId,
        unitId,
        levelName: session.levelName,
        selections: mapToSelections(next),
        ueLoadId,
        updatedAt: new Date().toISOString(),
      };
      const result = saveDraft(draft);
      if (!result.ok) {
        setSaveStatus("unsaved");
        setStorageWarning(
          result.reason === "quota"
            ? "Storage full — continuing in memory only."
            : "Storage blocked — continuing in memory only.",
        );
      }
    },
    [viewOnly, unitId, session, streamProjectId],
  );

  /** Commit selection immediately — source of truth for active UI. */
  const select = useCallback(
    (entry: SelectionEntry): boolean => {
      if (viewOnly) return false;
      setMap((prev) => {
        const next = {
          ...prev,
          [entry.slot]: {
            meshId: entry.meshId,
            materialId: entry.materialId,
            cameraId: entry.cameraId,
            cameraIndex: entry.cameraIndex,
          },
        };
        persist(next);
        return next;
      });
      return true;
    },
    [viewOnly, persist],
  );

  const removeSlot = useCallback(
    (slot: string) => {
      if (viewOnly) return;
      setMap((prev) => {
        if (!(slot in prev)) return prev;
        const next = { ...prev };
        delete next[slot];
        persist(next);
        return next;
      });
    },
    [viewOnly, persist],
  );

  const resetAll = useCallback(() => {
    setMap({});
    setHydrated(true);
    setSaveStatus("unsaved");
    if (!unitId) return;
    const ref = loadDraft(streamProjectId, unitId)?.ueLoadId;
    saveDraft({
      version: 1,
      streamProjectId,
      unitId,
      levelName: session?.levelName ?? "",
      selections: [],
      ueLoadId: ref,
      updatedAt: new Date().toISOString(),
    });
  }, [streamProjectId, unitId, session?.levelName]);

  const clearAfterSubmit = useCallback(() => {
    if (unitId) clearDraft(streamProjectId, unitId);
    setSaveStatus("saved");
  }, [streamProjectId, unitId]);

  const selections = useMemo(() => mapToSelections(map), [map]);
  const optimisticPrice = useMemo(() => {
    if (!session) return 0;
    return estimatePriceFromSession(session, map);
  }, [session, map]);

  const markSaveStatus = useCallback((status: SaveStatus) => {
    setSaveStatus(status);
  }, []);

  const customizationRef = unitId
    ? (loadDraft(streamProjectId, unitId)?.ueLoadId ?? null)
    : null;

  return {
    map,
    selections,
    hydrated,
    optimisticPrice,
    storageWarning,
    saveStatus,
    customizationRef,
    markSaveStatus,
    hydrateFromStorage,
    hydrateFromDesign,
    /** @deprecated use select — kept for call-site compatibility */
    intendSelect: select,
    select,
    commit: select,
    removeSlot,
    resetAll,
    clearAfterSubmit,
    setMapDirect: setMap,
  };
}
