import type { TApartmentSearchItem } from "@/services/search-apartments.service";

/** Input/list label after picking a search hit, e.g. `1007-1Bedroom-Type 3-789.39 sqft`. */
export function formatApartmentSearchLabel(item: TApartmentSearchItem): string {
  const number = item.apartment_number.trim();
  const category = item.layout.category.name.replace(/\s+/g, "");
  const type = item.layout.type.name.trim();
  const area = item.layout.area?.trim();
  return [number, category, type, area ? `${area} sqft` : null]
    .filter((part): part is string => Boolean(part))
    .join(" - ");
}

/** API search token only — never the display label. */
export function apartmentNumberFromQuery(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+-\s+/)[0]?.trim() || trimmed;
}

export function formatAreaSqFt(
  area: string | number | null | undefined,
): string | null {
  if (area == null || area === "") return null;
  const n =
    typeof area === "number"
      ? area
      : Number(String(area).replace(/,/g, "").trim());
  if (!Number.isFinite(n) || n <= 0) return null;
  return `(${Math.round(n).toLocaleString("en-US")} Sq Ft)`;
}
