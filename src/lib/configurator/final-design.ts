import type { ConfiguratorSession, SelectionEntry } from "@/types/configurator";

/** Catalog price for one selection line (fixed price or per-sqm × mesh area). */
export function linePrice(
  session: ConfiguratorSession,
  sel: SelectionEntry,
): number {
  const mat = session.materials.find((m) => m.id === sel.materialId);
  if (!mat) return 0;
  if (mat.fixedPrice != null) return Math.round(mat.fixedPrice);
  const area =
    session.meshAreas.find((a) => a.meshId === sel.meshId)?.areaSqm ?? 1;
  return Math.round((mat.pricePerSqm ?? 0) * area);
}
