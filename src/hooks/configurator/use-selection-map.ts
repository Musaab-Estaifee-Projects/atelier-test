"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { estimatePriceFromSession } from "@/lib/configurator/pricing";
import { customMapToStored, storedToSelectionMap } from "@/lib/configurator/api-selections";
import {
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

function applyEntry(
  prev: SelectionMap,
  defaults: SelectionEntry[] | undefined,
  entry: SelectionEntry,
): SelectionMap {
  const next = { ...prev };
  if (isDefaultEntry(defaults, entry)) delete next[entry.slot];
  else {
    next[entry.slot] = {
      meshId: entry.meshId,
      materialId: entry.materialId,
      cameraId: entry.cameraId,
      cameraIndex: entry.cameraIndex,
    };
  }
  return omitDefaults(defaults, next);
}

/**
 * EDIT-mode FE map + localStorage persistence (custom finishes only).
 * Camera/zone are URL-only. Defaults are never stored.
 */
export function useSelectionMap(args: {
  streamProjectId: string;
  backendProjectId: string;
  layoutCode: string;
  apartmentId?: string | null;
  designCode: string | null;
  session: ConfiguratorSession | null;
  viewOnly: boolean;
}) {
  const {
    streamProjectId,
    backendProjectId,
    layoutCode,
    apartmentId,
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
  const mapRef = useRef<SelectionMap>({});
  const tokensRef = useRef<Record<string, number>>({});
  // eslint-disable-next-line react-hooks/refs -- optimistic select/revert read the latest map synchronously
  mapRef.current = map;

  const persist = useCallback(
    (next: SelectionMap) => {
      if (viewOnly || !designCode) return;
      const custom = omitDefaults(session?.defaults, next);
      const draft = {
        version: 3 as const,
        streamProjectId,
        projectId: backendProjectId,
        layoutCode: session?.layoutCode || layoutCode,
        apartmentId,
        designCode,
        selections: customMapToStored(session, custom),
        selectionRevision: 0 as const,
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
      session,
      layoutCode,
      apartmentId,
      streamProjectId,
      backendProjectId,
    ],
  );

  const isCurrent = useCallback((slot: string, token: number) => {
    return tokensRef.current[slot] === token;
  }, []);

  const nextToken = useCallback((slot: string) => {
    const token = (tokensRef.current[slot] ?? 0) + 1;
    tokensRef.current[slot] = token;
    return token;
  }, []);

  const hydrateFromStorage = useCallback(() => {
    if (viewOnly || !session || !designCode) return;
    const key = `${streamProjectId}:${backendProjectId}:${session.layoutCode}:${apartmentId ?? "none"}:${designCode}`;
    if (hydratedKeyRef.current === key) {
      setHydrated(true);
      return;
    }
    hydratedKeyRef.current = key;

    const meshOk = new Set(session.meshes.map((m) => m.id));
    const matOk = new Set(session.materials.map((m) => m.id));
    const draft = loadDraft(
      streamProjectId,
      backendProjectId,
      session.layoutCode,
      apartmentId,
    );
    const storedMap = storedToSelectionMap(draft?.selections ?? []);
    const stored = omitDefaults(
      session.defaults,
      Object.fromEntries(
        Object.entries(storedMap).filter(([, s]) => {
          const meshValid = meshOk.has(s.meshId);
          const matValid = !s.materialId || matOk.has(s.materialId);
          return meshValid && matValid;
        }),
      ),
    );
    setMap(stored);
    committedRef.current = stored;
    persist(stored);
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
    apartmentId,
    persist,
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
    (entry: SelectionEntry): number | false => {
      if (viewOnly) return false;
      const token = nextToken(entry.slot);
      const next = applyEntry(mapRef.current, session?.defaults, entry);
      mapRef.current = next;
      setMap(next);
      persist(next);
      return token;
    },
    [viewOnly, session?.defaults, persist, nextToken],
  );

  const removeSlot = useCallback(
    (slot: string): number | false => {
      if (viewOnly) return false;
      const token = nextToken(slot);
      const prev = mapRef.current;
      if (!(slot in prev)) return token;
      const next = { ...prev };
      delete next[slot];
      const cleaned = omitDefaults(session?.defaults, next);
      mapRef.current = cleaned;
      setMap(cleaned);
      persist(cleaned);
      return token;
    },
    [viewOnly, persist, nextToken, session?.defaults],
  );

  const resetAll = useCallback(() => {
    tokensRef.current = {};
    mapRef.current = {};
    setMap({});
    setHydrated(true);
    setSaveStatus("saving");
    persist({});
  }, [persist]);

  const commitSlot = useCallback(
    (slot: string, entry: SelectionEntry | null, token?: number) => {
      if (token != null && !isCurrent(slot, token)) return;
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
    [persist, session?.defaults, isCurrent],
  );

  const revertSlot = useCallback(
    (slot: string) => {
      const next = { ...mapRef.current };
      const committed = committedRef.current[slot];
      if (committed) next[slot] = committed;
      else delete next[slot];
      const cleaned = omitDefaults(session?.defaults, next);
      mapRef.current = cleaned;
      setMap(cleaned);
      persist(committedRef.current);
    },
    [persist, session?.defaults],
  );

  const commitReset = useCallback(() => {
    tokensRef.current = {};
    mapRef.current = {};
    committedRef.current = {};
    persist({});
  }, [persist]);

  const revertReset = useCallback(() => {
    const next = { ...committedRef.current };
    mapRef.current = next;
    setMap(next);
    persist(next);
  }, [persist]);

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
    isCurrent,
    commit: select,
    commitSlot,
    revertSlot,
    commitReset,
    revertReset,
    removeSlot,
    resetAll,
    setMapDirect: setMap,
  };
}
