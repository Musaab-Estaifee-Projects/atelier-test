import { residenceSubtitle } from "@/lib/configurator/residence-label";
import type { SavedDesignData } from "@/services/get-saved-design.service";

export function formatQuotationDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const day = d.getUTCDate();
  const month = d
    .toLocaleString("en-GB", { month: "short", timeZone: "UTC" })
    .toUpperCase();
  const year = d.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

export function formatQuotationTotal(amount: string): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return amount;
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function quotationResidenceSubtitle(
  property: SavedDesignData["property"],
): string {
  return residenceSubtitle({
    projectName: property.project?.name,
    categoryName: property.category?.display_name,
    typeName: property.unit_type?.display_name,
    area: property.layout?.area_sqft,
  });
}
