"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { estimatePriceFromSession } from "@/lib/configurator/pricing";
import {
  clearDraft,
  isDefaultEntry,
  isUsingMemoryOnlyStorage,
  loadDraft,
  mapToSelections,
  omitDefaults,
  saveDraft,
  selectionsToMap,
} from "@/lib/configurator/storage";
import type {
  ConfiguratorSession,
  SelectionEntry,
  SelectionMap,
} from "@/types/configurator";

export type SaveStatus = "idle" | "saving" | "saved" | "failed";

/**
 * EDIT-mode FE map + localStorage persistence (selections + designCode).
 * Map stores custom (non-default) finishes only. Camera/zone are URL-only.
 * localStorage is updated only after Unreal SaveCustomization succeeds.
 */
export function useSelectionMap(args: {
  streamProjectId: string;
  backendProjectId: string;
  layoutCode: string;
  designCode: string | null;
  session: ConfiguratorSession | null;
  viewOnly: boolean;
}) {
  const {
    streamProjectId,
    backendProjectId,
    layoutCode,
    designCode,
    session,
    viewOnly,
  } = args;
  const [map, setMap] = useState<SelectionMap>({});
  const [hydrated, setHydrated] = useState(false);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const hydratedKeyRef = useRef<string | null>(null);
  const committedRef = useRef<SelectionMap>({});

  const persist = useCallback(
    (next: SelectionMap) => {
      if (viewOnly || !designCode) return;
      const custom = omitDefaults(session?.defaults, next);
      const draft = {
        version: 2 as const,
        streamProjectId,
        projectId: backendProjectId,
        layoutCode: session?.layoutCode || layoutCode,
        designCode,
        selections: mapToSelections(custom),
        updatedAt: new Date().toISOString(),
      };
      const result = saveDraft(draft);
      if (!result.ok) {
        setSaveStatus("failed");
        setStorageWarning(
          result.reason === "quota"
            ? "Storage full — continuing in memory only."
            : "Storage blocked — continuing in memory only.",
        );
      }
    },
    [
      viewOnly,
      designCode,
      session?.defaults,
      session?.layoutCode,
      layoutCode,
      streamProjectId,
      backendProjectId,
    ],
  );

  const hydrateFromStorage = useCallback(() => {
    if (viewOnly || !session || !designCode) return;
    const key = `${streamProjectId}:${backendProjectId}:${session.layoutCode}:${designCode}`;
    if (hydratedKeyRef.current === key) {
      setHydrated(true);
      return;
    }
    hydratedKeyRef.current = key;

    const meshOk = new Set(session.meshes.map((m) => m.id));
    const matOk = new Set(session.materials.map((m) => m.id));
    const valid = (s: SelectionEntry) =>
      meshOk.has(s.meshId) && (!s.materialId || matOk.has(s.materialId));

    const draft = loadDraft(
      streamProjectId,
      backendProjectId,
      session.layoutCode,
    );
    const stored = omitDefaults(
      session.defaults,
      selectionsToMap((draft?.selections ?? []).filter(valid)),
    );
    setMap(stored);
    committedRef.current = stored;
    setSaveStatus("saved");
    setHydrated(true);

    if (isUsingMemoryOnlyStorage()) {
      setStorageWarning(
        "Browser storage unavailable — edits stay in this tab only.",
      );
    }
  }, [
    streamProjectId,
    backendProjectId,
    session,
    viewOnly,
    designCode,
  ]);

  const hydrateFromDesign = useCallback(
    (selections: SelectionEntry[]) => {
      hydratedKeyRef.current = `view:${streamProjectId}`;
      if (!session) {
        const next = selectionsToMap(selections);
        setMap(next);
        committedRef.current = next;
        setHydrated(true);
        return;
      }
      const meshOk = new Set(session.meshes.map((m) => m.id));
      const matOk = new Set(session.materials.map((m) => m.id));
      const cleaned = selections.filter(
        (s) =>
          meshOk.has(s.meshId) && (!s.materialId || matOk.has(s.materialId)),
      );
      const next = omitDefaults(session.defaults, selectionsToMap(cleaned));
      setMap(next);
      committedRef.current = next;
      setSaveStatus("saved");
      setHydrated(true);
    },
    [session, streamProjectId],
  );

  const select = useCallback(
    (entry: SelectionEntry): boolean => {
      if (viewOnly) return false;
      setMap((prev) => {
        const next = { ...prev };
        if (isDefaultEntry(session?.defaults, entry)) {
          delete next[entry.slot];
        } else {
          next[entry.slot] = {
            meshId: entry.meshId,
            materialId: entry.materialId,
            cameraId: entry.cameraId,
            cameraIndex: entry.cameraIndex,
          };
        }
        return next;
      });
      return true;
    },
    [viewOnly, session?.defaults],
  );

  const removeSlot = useCallback(
    (slot: string) => {
      if (viewOnly) return;
      setMap((prev) => {
        if (!(slot in prev)) return prev;
        const next = { ...prev };
        delete next[slot];
        return next;
      });
    },
    [viewOnly],
  );

  const resetAll = useCallback(() => {
    setMap({});
    setHydrated(true);
    setSaveStatus("saving");
  }, []);

  const commitSlot = useCallback(
    (slot: string, entry: SelectionEntry | null) => {
      const next = { ...committedRef.current };
      if (!entry || isDefaultEntry(session?.defaults, entry)) {
        delete next[slot];
      } else {
        next[slot] = {
          meshId: entry.meshId,
          materialId: entry.materialId,
          cameraId: entry.cameraId,
          cameraIndex: entry.cameraIndex,
        };
      }
      committedRef.current = omitDefaults(session?.defaults, next);
      persist(committedRef.current);
    },
    [persist, session?.defaults],
  );

  const revertSlot = useCallback((slot: string) => {
    setMap((prev) => {
      const next = { ...prev };
      const committed = committedRef.current[slot];
      if (committed) next[slot] = committed;
      else delete next[slot];
      return next;
    });
  }, []);

  const commitReset = useCallback(() => {
    committedRef.current = {};
    persist({});
  }, [persist]);

  const revertReset = useCallback(() => {
    setMap({ ...committedRef.current });
  }, []);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const clearAfterSubmit = useCallback(() => {
    if (session?.layoutCode) {
      clearDraft(streamProjectId, backendProjectId, session.layoutCode);
    }
    committedRef.current = {};
    setSaveStatus("saved");
  }, [streamProjectId, backendProjectId, session?.layoutCode]);

  const selections = useMemo(() => mapToSelections(map), [map]);
  const optimisticPrice = useMemo(() => {
    if (!session) return 0;
    return estimatePriceFromSession(session, map);
  }, [session, map]);

  const markSaveStatus = useCallback((status: SaveStatus) => {
    setSaveStatus(status);
  }, []);

  return {
    map,
    selections,
    hydrated,
    optimisticPrice,
    storageWarning,
    saveStatus,
    designCode,
    markSaveStatus,
    hydrateFromStorage,
    hydrateFromDesign,
    intendSelect: select,
    select,
    commit: select,
    commitSlot,
    revertSlot,
    commitReset,
    revertReset,
    removeSlot,
    resetAll,
    clearAfterSubmit,
    setMapDirect: setMap,
  };
}
