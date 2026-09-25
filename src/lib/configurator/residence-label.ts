import { formatAreaSqFt } from "@/lib/projects/apartment-display";

export type ResidenceLabel = {
  projectSlug?: string;
  projectName?: string;
  categoryName?: string;
  typeName?: string;
  layoutCode?: string;
  apartmentNumber?: string | null;
  area?: string | null;
};

const STORAGE_KEY = "atelier:residence";

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

export function residenceSubtitle(args: {
  projectName?: string | null;
  categoryName?: string | null;
  typeName?: string | null;
  area?: string | number | null;
}): string {
  const parts = [args.projectName, args.categoryName, args.typeName]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
  const base = parts.join(" - ");
  if (!base) return "Your residence";
  const area = formatAreaSqFt(args.area);
  return area ? `${base} ${area}` : base;
}

type CatalogIdentity = {
  code?: string | null;
  project?: { code?: string | null; name?: string | null } | null;
  category?: { name?: string | null } | null;
  type?: { name?: string | null } | null;
  area?: string | number | null;
};

/** Names from the layout catalog. Null when the payload has none. Area is kept only when it formats. */
export function residenceFromCatalog(
  catalog: CatalogIdentity,
): ResidenceLabel | null {
  const projectName = catalog.project?.name?.trim() || undefined;
  const categoryName = catalog.category?.name?.trim() || undefined;
  const typeName = catalog.type?.name?.trim() || undefined;
  if (!projectName && !categoryName && !typeName) return null;

  const areaRaw =
    catalog.area == null || catalog.area === ""
      ? undefined
      : String(catalog.area).trim();
  const area = areaRaw && formatAreaSqFt(areaRaw) ? areaRaw : undefined;

  return {
    projectSlug: catalog.project?.code?.trim() || undefined,
    projectName,
    categoryName,
    typeName,
    layoutCode: catalog.code?.trim() || undefined,
    area,
  };
}

/**
 * Merge catalog identity into the stored residence label.
 * Missing catalog area keeps any area already saved from the journey.
 */
export function applyCatalogResidence(
  catalog: CatalogIdentity,
): ResidenceLabel | null {
  const next = residenceFromCatalog(catalog);
  if (!next) return null;
  const existing = readResidenceLabel();
  const merged: ResidenceLabel = {
    projectSlug: next.projectSlug || existing?.projectSlug,
    projectName: next.projectName || existing?.projectName,
    categoryName: next.categoryName || existing?.categoryName,
    typeName: next.typeName || existing?.typeName,
    layoutCode: next.layoutCode || existing?.layoutCode,
    apartmentNumber: existing?.apartmentNumber ?? null,
    area: next.area ?? existing?.area ?? null,
  };
  writeResidenceLabel(merged);
  return merged;
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
    area: label.area?.trim() || undefined,
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
