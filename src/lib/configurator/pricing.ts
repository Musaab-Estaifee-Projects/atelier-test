// src/lib/configurator/pricing.ts
import type {
  ConfiguratorSession,
  SelectionEntry,
  SelectionMap,
} from "@/types/configurator";
import { mapToSelections } from "@/lib/configurator/storage";

/** Optimistic client price from session catalog (EDIT). */
export function estimatePriceFromSession(
  session: ConfiguratorSession,
  map: SelectionMap | SelectionEntry[],
): number {
  const list = Array.isArray(map) ? map : mapToSelections(map);
  const areaByMesh = new Map(
    session.meshAreas.map((a) => [a.meshId, a.areaSqm]),
  );
  const matById = new Map(session.materials.map((m) => [m.id, m]));

  let total = 0;
  for (const sel of list) {
    const mat = matById.get(sel.materialId);
    if (!mat) continue;
    if (mat.fixedPrice != null) {
      total += mat.fixedPrice;
      continue;
    }
    const area = areaByMesh.get(sel.meshId) ?? 1;
    total += (mat.pricePerSqm ?? 0) * area;
  }
  return Math.round(total);
}

/**
 * MOCK server-side recompute — never trust client price on submit.
 * // MOCK: replace with real pricing service
 */
export function computeAuthoritativePrice(
  session: ConfiguratorSession,
  selections: SelectionEntry[],
): number {
  // Intentionally same formula as optimistic for demo, but called only in mock submit
  return estimatePriceFromSession(session, selections);
}
