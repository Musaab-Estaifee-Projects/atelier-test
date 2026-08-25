import type {
  LocalDraft,
  SelectionEntry,
  SelectionMap,
} from "@/types/configurator";

export function draftStorageKey(
  streamProjectId: string,
  unitId: string,
): string {
  return `atelier:config:${streamProjectId}:${unitId}`;
}

export type StorageWriteResult =
  | { ok: true }
  | { ok: false; reason: "quota" | "unavailable" | "parse" };

const memoryFallback: Record<string, LocalDraft> = {};
let storageWarned = false;

export function isUsingMemoryOnlyStorage(): boolean {
  return storageWarned;
}

export function loadDraft(
  streamProjectId: string,
  unitId: string,
): LocalDraft | null {
  const key = draftStorageKey(streamProjectId, unitId);
  if (memoryFallback[key]) return memoryFallback[key];
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalDraft;
    if (parsed?.version !== 1 || !Array.isArray(parsed.selections)) return null;
    memoryFallback[key] = parsed;
    return parsed;
  } catch {
    return null;
  }
}

export function saveDraft(draft: LocalDraft): StorageWriteResult {
  const key = draftStorageKey(draft.streamProjectId, draft.unitId);
  const prev = memoryFallback[key] ?? null;
  const merged: LocalDraft = {
    ...prev,
    ...draft,
    ueLoadId: draft.ueLoadId ?? prev?.ueLoadId,
  };
  memoryFallback[key] = merged;
  if (typeof window === "undefined") {
    storageWarned = true;
    return { ok: false, reason: "unavailable" };
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(merged));
    return { ok: true };
  } catch (err) {
    storageWarned = true;
    const name = (err as { name?: string })?.name;
    if (name === "QuotaExceededError") {
      return { ok: false, reason: "quota" };
    }
    return { ok: false, reason: "unavailable" };
  }
}

export function clearDraft(streamProjectId: string, unitId: string): void {
  const key = draftStorageKey(streamProjectId, unitId);
  delete memoryFallback[key];
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Persist UE LoadCustomization id without touching selections. */
export function saveUeLoadId(
  streamProjectId: string,
  unitId: string,
  ueLoadId: string,
): void {
  const existing = loadDraft(streamProjectId, unitId);
  if (!existing) return;
  saveDraft({ ...existing, ueLoadId, updatedAt: new Date().toISOString() });
}

export function getUeLoadId(
  streamProjectId: string,
  unitId: string | null,
): string | null {
  if (!unitId) return null;
  return loadDraft(streamProjectId, unitId)?.ueLoadId?.trim() || null;
}

/**
 * Reuse the stored UE LoadCustomization id for this unit.
 * Does not invent a LoadID — that arrives from SaveCustomization.
 */
export function ensureCustomizationRef(
  streamProjectId: string,
  unitId: string,
  _levelName?: string,
): string | undefined {
  return getUeLoadId(streamProjectId, unitId) ?? undefined;
}

export function selectionsToMap(list: SelectionEntry[]): SelectionMap {
  const map: SelectionMap = {};
  for (const s of list) {
    if (!s.slot || !s.meshId) continue;
    map[s.slot] = {
      meshId: s.meshId,
      // Empty string = mesh-only finish (no materials catalog)
      materialId: s.materialId ?? "",
      cameraId: s.cameraId,
      cameraIndex: s.cameraIndex,
    };
  }
  return map;
}

export function mapToSelections(map: SelectionMap): SelectionEntry[] {
  return Object.entries(map).map(([slot, v]) => ({
    slot,
    meshId: v.meshId,
    materialId: v.materialId,
    cameraId: v.cameraId,
    cameraIndex: v.cameraIndex,
  }));
}
