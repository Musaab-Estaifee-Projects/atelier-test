import type {
  LocalDraft,
  SelectionEntry,
  SelectionMap,
} from "@/types/configurator";

export function draftStorageKey(
  streamProjectId: string,
  projectId: string,
  layoutCode: string,
): string {
  return `atelier:config:${streamProjectId}:${projectId}:${layoutCode}`;
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
  return d.version === 2 && typeof d.designCode === "string" && Array.isArray(d.selections);
}

export function loadDraft(
  streamProjectId: string,
  projectId: string,
  layoutCode: string,
): LocalDraft | null {
  const key = draftStorageKey(streamProjectId, projectId, layoutCode);
  if (memoryFallback[key]) return memoryFallback[key];
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isDraft(parsed)) return null;
    memoryFallback[key] = parsed;
    return parsed;
  } catch {
    return null;
  }
}

export function saveDraft(draft: LocalDraft): StorageWriteResult {
  const key = draftStorageKey(
    draft.streamProjectId,
    draft.projectId,
    draft.layoutCode,
  );
  const prev = memoryFallback[key] ?? null;
  const merged: LocalDraft = {
    ...prev,
    ...draft,
    designCode: draft.designCode || prev?.designCode || "",
    version: 2,
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

export function clearDraft(
  streamProjectId: string,
  projectId: string,
  layoutCode: string,
): void {
  const key = draftStorageKey(streamProjectId, projectId, layoutCode);
  delete memoryFallback[key];
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function generateDesignCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `AT-${suffix}`;
}

/** Codes created in this JS runtime so Strict Mode remounts are not "returning". */
const generatedThisRuntime = new Set<string>();

/** Reuse existing design_code or create one for this stream/project/layout. */
export function ensureDesignCode(args: {
  streamProjectId: string;
  projectId: string;
  layoutCode: string;
  urlDesignCode?: string | null;
}): { designCode: string; returning: boolean } {
  const fromUrl = args.urlDesignCode?.trim() || "";
  const draft = loadDraft(
    args.streamProjectId,
    args.projectId,
    args.layoutCode,
  );
  const fromDraft = draft?.designCode?.trim() || "";

  const isReturning = (code: string) =>
    Boolean(code) && !generatedThisRuntime.has(code);

  if (fromUrl) {
    if (draft && fromDraft && fromDraft !== fromUrl) {
      saveDraft({
        ...draft,
        designCode: fromUrl,
        updatedAt: new Date().toISOString(),
      });
    }
    return { designCode: fromUrl, returning: isReturning(fromUrl) };
  }
  if (fromDraft) {
    return { designCode: fromDraft, returning: isReturning(fromDraft) };
  }
  const designCode = generateDesignCode();
  generatedThisRuntime.add(designCode);
  saveDraft({
    version: 2,
    streamProjectId: args.streamProjectId,
    projectId: args.projectId,
    layoutCode: args.layoutCode,
    designCode,
    selections: draft?.selections ?? [],
    updatedAt: new Date().toISOString(),
  });
  return { designCode, returning: false };
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
