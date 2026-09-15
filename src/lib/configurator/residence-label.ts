export type ResidenceLabel = {
  projectSlug?: string;
  projectName?: string;
  categoryName?: string;
  typeName?: string;
  layoutCode?: string;
  apartmentNumber?: string | null;
};

const STORAGE_KEY = "atelier:residence";

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

export function residenceSubtitle(args: {
  projectName?: string | null;
  categoryName?: string | null;
  typeName?: string | null;
}): string {
  const parts = [args.projectName, args.categoryName, args.typeName]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
  return parts.join(" - ") || "Your residence";
}

export function writeResidenceLabel(label: ResidenceLabel): void {
  if (!canUseStorage()) return;
  const payload: ResidenceLabel = {
    projectSlug: label.projectSlug?.trim() || undefined,
    projectName: label.projectName?.trim() || undefined,
    categoryName: label.categoryName?.trim() || undefined,
    typeName: label.typeName?.trim() || undefined,
    layoutCode: label.layoutCode?.trim() || undefined,
    apartmentNumber: label.apartmentNumber?.trim() || null,
  };
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      const json = JSON.stringify(payload);
      window.sessionStorage.setItem(STORAGE_KEY, json);
    } catch {
      /* private mode / quota */
    }
}

export function readResidenceLabel(): ResidenceLabel | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ResidenceLabel;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function currentResidenceSubtitle(): string {
  const stored = readResidenceLabel();
  if (!stored) return "Your residence";
  return residenceSubtitle(stored);
}
