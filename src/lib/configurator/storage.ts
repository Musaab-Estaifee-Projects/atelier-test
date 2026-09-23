import { customMapToStored, normalizeStoredSelections, storedToSelectionMap } from "@/lib/configurator/api-selections";
import type {
  LocalDraft,
  SelectionEntry,
  SelectionMap,
} from "@/types/configurator";
import type { StoredSelection } from "@/types/stored-selection";

export function draftStorageKey(
  streamProjectId: string,
  projectId: string,
  layoutCode: string,
  apartmentId?: string | null,
): string {
  const base = `atelier:config:${streamProjectId}:${projectId}:${layoutCode}`;
  const id = apartmentId?.trim();
  return id ? `${base}:${id}` : base;
}

function draftStorageKeyCandidates(
  streamProjectId: string,
  projectId: string,
  layoutCode: string,
  apartmentId?: string | null,
): string[] {
  const base = `atelier:config:${streamProjectId}:${projectId}:${layoutCode}`;
  const id = apartmentId?.trim();
  const keys = [draftStorageKey(streamProjectId, projectId, layoutCode, apartmentId)];
  if (id) keys.push(base);
  keys.push(`${base}:none`);
  return [...new Set(keys)];
}

export type StorageWriteResult =
  | { ok: true }
  | { ok: false; reason: "quota" | "unavailable" | "parse" };

const memoryFallback: Record<string, LocalDraft> = {};
let storageWarned = false;

export function isUsingMemoryOnlyStorage(): boolean {
  return storageWarned;
}

function isDraft(value: unknown): value is LocalDraft {
  if (!value || typeof value !== "object") return false;
  const d = value as LocalDraft;
  return (
    d.version === 3 &&
    typeof d.designCode === "string" &&
    Array.isArray(d.selections)
  );
}

function migrateDraft(
  value: unknown,
  fallback: {
    streamProjectId: string;
    projectId: string;
    layoutCode: string;
    apartmentId?: string | null;
  },
): LocalDraft | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (isDraft(value)) {
    return {
      ...value,
      apartmentId: value.apartmentId ?? fallback.apartmentId ?? null,
      selectionRevision: 0,
      selections: normalizeStoredSelections(value.selections),
    };
  }
  if (raw.version === 2 && typeof raw.designCode === "string") {
    return {
      version: 3,
      streamProjectId: String(raw.streamProjectId ?? fallback.streamProjectId),
      projectId: String(raw.projectId ?? fallback.projectId),
      layoutCode: String(raw.layoutCode ?? fallback.layoutCode),
      apartmentId: fallback.apartmentId ?? null,
      designCode: raw.designCode,
      selections: normalizeStoredSelections(raw.selections),
      selectionRevision: 0,
      summaryToken: null,
      summaryExpiresAt: null,
      prepareIdempotencyKey: null,
      highResCaptureSent: false,
      updatedAt:
        typeof raw.updatedAt === "string"
          ? raw.updatedAt
          : new Date().toISOString(),
    };
  }
  return null;
}

function readRaw(key: string): unknown | null {
  if (memoryFallback[key]) return memoryFallback[key];
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export function loadDraft(
  streamProjectId: string,
  projectId: string,
  layoutCode: string,
  apartmentId?: string | null,
): LocalDraft | null {
  const canonical = draftStorageKey(
    streamProjectId,
    projectId,
    layoutCode,
    apartmentId,
  );
  for (const key of draftStorageKeyCandidates(
    streamProjectId,
    projectId,
    layoutCode,
    apartmentId,
  )) {
    const migrated = migrateDraft(readRaw(key), {
      streamProjectId,
      projectId,
      layoutCode,
      apartmentId,
    });
    if (migrated) {
      memoryFallback[canonical] = migrated;
      return migrated;
    }
  }
  return null;
}

export function saveDraft(draft: LocalDraft): StorageWriteResult {
  const key = draftStorageKey(
    draft.streamProjectId,
    draft.projectId,
    draft.layoutCode,
    draft.apartmentId,
  );
  const prev = memoryFallback[key] ?? null;
  const merged: LocalDraft = {
    ...prev,
    ...draft,
    version: 3,
    designCode: draft.designCode || prev?.designCode || "",
    selections: normalizeStoredSelections(draft.selections),
    selectionRevision: 0,
    apartmentId: draft.apartmentId ?? prev?.apartmentId ?? null,
  };
  const sharedIdempotency =
    merged.prepareIdempotencyKey ?? merged.retryIdempotencyKey ?? null;
  merged.prepareIdempotencyKey = sharedIdempotency;
  merged.retryIdempotencyKey = sharedIdempotency;
  memoryFallback[key] = merged;
  if (typeof window === "undefined") {
    storageWarned = true;
    return { ok: false, reason: "unavailable" };
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(merged));
    const noneKey = `atelier:config:${draft.streamProjectId}:${draft.projectId}:${draft.layoutCode}:none`;
    if (noneKey !== key) window.localStorage.removeItem(noneKey);
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

export function patchDraft(
  args: {
    streamProjectId: string;
    projectId: string;
    layoutCode: string;
    apartmentId?: string | null;
  },
  patch: Partial<LocalDraft>,
): StorageWriteResult {
  const prev = loadDraft(
    args.streamProjectId,
    args.projectId,
    args.layoutCode,
    args.apartmentId,
  );
  if (!prev && !patch.designCode) {
    return { ok: false, reason: "unavailable" };
  }
  return saveDraft({
    version: 3,
    streamProjectId: args.streamProjectId,
    projectId: args.projectId,
    layoutCode: args.layoutCode,
    apartmentId: args.apartmentId ?? prev?.apartmentId ?? null,
    designCode: patch.designCode || prev?.designCode || "",
    selections: patch.selections ?? prev?.selections ?? [],
    selectionRevision: 0,
    summaryToken:
      patch.summaryToken !== undefined
        ? patch.summaryToken
        : (prev?.summaryToken ?? null),
    summaryExpiresAt:
      patch.summaryExpiresAt !== undefined
        ? patch.summaryExpiresAt
        : (prev?.summaryExpiresAt ?? null),
    prepareIdempotencyKey:
      patch.prepareIdempotencyKey !== undefined
        ? patch.prepareIdempotencyKey
        : (prev?.prepareIdempotencyKey ?? null),
    retryIdempotencyKey:
      patch.retryIdempotencyKey !== undefined
        ? patch.retryIdempotencyKey
        : (prev?.retryIdempotencyKey ?? null),
    highResCaptureSent:
      patch.highResCaptureSent !== undefined
        ? patch.highResCaptureSent
        : (prev?.highResCaptureSent ?? false),
    updatedAt: new Date().toISOString(),
  });
}

export function clearDraft(
  streamProjectId: string,
  projectId: string,
  layoutCode: string,
  apartmentId?: string | null,
): void {
  const keys = draftStorageKeyCandidates(
    streamProjectId,
    projectId,
    layoutCode,
    apartmentId,
  );
  for (const key of keys) delete memoryFallback[key];
  if (typeof window === "undefined") return;
  try {
    for (const key of keys) window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function freshStartIntentKey(
  streamProjectId: string,
  projectId: string,
  layoutCode: string,
  apartmentId?: string | null,
): string {
  const apt = apartmentId?.trim() || "none";
  return `atelier:fresh-start:${streamProjectId}:${projectId}:${layoutCode}:${apt}`;
}

/** Survives the hard reload from "Start new customization" so boot creates a new design_code. */
export function markFreshStartIntent(
  streamProjectId: string,
  projectId: string,
  layoutCode: string,
  apartmentId?: string | null,
): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      freshStartIntentKey(streamProjectId, projectId, layoutCode, apartmentId),
      "1",
    );
  } catch {
    /* ignore */
  }
}

export function consumeFreshStartIntent(
  streamProjectId: string,
  projectId: string,
  layoutCode: string,
  apartmentId?: string | null,
): boolean {
  if (typeof window === "undefined") return false;
  try {
    const key = freshStartIntentKey(
      streamProjectId,
      projectId,
      layoutCode,
      apartmentId,
    );
    const marked = window.sessionStorage.getItem(key) === "1";
    if (marked) window.sessionStorage.removeItem(key);
    return marked;
  } catch {
    return false;
  }
}

export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `idemp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function selectionsToMap(list: SelectionEntry[]): SelectionMap {
  const map: SelectionMap = {};
  for (const s of list) {
    if (!s.slot || !s.meshId) continue;
    map[s.slot] = {
      meshId: s.meshId,
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

export function isDefaultEntry(
  defaults: SelectionEntry[] | undefined,
  entry: { slot: string; meshId: string; materialId?: string },
): boolean {
  const fallback = defaults?.find((d) => d.slot === entry.slot);
  if (!fallback) return false;
  return (
    fallback.meshId === entry.meshId &&
    (fallback.materialId || "") === (entry.materialId || "")
  );
}

/** Drop catalog-default finishes so they are never stored as selections. */
export function omitDefaults(
  defaults: SelectionEntry[] | undefined,
  map: SelectionMap,
): SelectionMap {
  const next: SelectionMap = {};
  for (const [slot, value] of Object.entries(map)) {
    if (!isDefaultEntry(defaults, { slot, ...value })) next[slot] = value;
  }
  return next;
}

/** Current applied finish for UI chips: custom override, else catalog default. */
export function appliedSelectionMap(
  defaults: SelectionEntry[] | undefined,
  custom: SelectionMap,
): SelectionMap {
  return { ...selectionsToMap(defaults ?? []), ...custom };
}

export function storedSelectionsFromCustom(
  session: Parameters<typeof customMapToStored>[0],
  custom: SelectionMap,
): StoredSelection[] {
  return customMapToStored(session, custom);
}

export function customMapFromStored(list: StoredSelection[]): SelectionMap {
  return storedToSelectionMap(list);
}

/** Leftover `renders=1` with no prepare job and no high-res capture. */
export function isUnstartedRendersDraft(draft: LocalDraft | null): boolean {
  if (!draft) return true;
  return !draft.highResCaptureSent && !draft.prepareIdempotencyKey?.trim();
}

function layoutDraftPrefix(
  streamProjectId: string,
  projectId: string,
  layoutCode: string,
) {
  return `atelier:config:${streamProjectId}:${projectId}:${layoutCode}`;
}

/** Any local draft for this stream + project + layout, regardless of apartment. */
export function hasDraftForLayout(
  streamProjectId: string,
  projectId: string,
  layoutCode: string,
): boolean {
  const prefix = layoutDraftPrefix(streamProjectId, projectId, layoutCode);
  for (const [key, draft] of Object.entries(memoryFallback)) {
    if ((key === prefix || key.startsWith(`${prefix}:`)) && draft?.designCode) {
      return true;
    }
  }
  if (typeof window === "undefined") return false;
  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key || (key !== prefix && !key.startsWith(`${prefix}:`))) continue;
      const migrated = migrateDraft(readRaw(key), {
        streamProjectId,
        projectId,
        layoutCode,
      });
      if (migrated?.designCode) return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export function clearDraftsForLayout(
  streamProjectId: string,
  projectId: string,
  layoutCode: string,
): void {
  const prefix = layoutDraftPrefix(streamProjectId, projectId, layoutCode);
  for (const key of Object.keys(memoryFallback)) {
    if (key === prefix || key.startsWith(`${prefix}:`)) {
      delete memoryFallback[key];
    }
  }
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && (key === prefix || key.startsWith(`${prefix}:`))) keys.push(key);
    }
    for (const key of keys) window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

