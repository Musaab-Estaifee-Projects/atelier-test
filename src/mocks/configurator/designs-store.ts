import type { StoredDesign } from "@/types/configurator";

const MEMORY = new Map<string, StoredDesign>();
const REGISTRY_KEY = "atelier:designs:registry";

function loadRegistry(): Record<string, StoredDesign> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(REGISTRY_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, StoredDesign>;
  } catch {
    return {};
  }
}

function saveRegistry(map: Record<string, StoredDesign>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(REGISTRY_KEY, JSON.stringify(map));
  } catch {
    /* quota / private — memory still holds design for session */
  }
}

/** MOCK in-memory + localStorage registry so refresh can demo view-only. */
export function mockSaveDesign(design: StoredDesign): void {
  MEMORY.set(design.designCode, design);
  const reg = loadRegistry();
  reg[design.designCode] = design;
  saveRegistry(reg);
}

export function mockGetDesign(designCode: string): StoredDesign | null {
  if (MEMORY.has(designCode)) return MEMORY.get(designCode)!;
  const reg = loadRegistry();
  const found = reg[designCode] ?? null;
  if (found) MEMORY.set(designCode, found);
  return found;
}

export function mockGenerateDesignCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `AT-${suffix}`;
}
