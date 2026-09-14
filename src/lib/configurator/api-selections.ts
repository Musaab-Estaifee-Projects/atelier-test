import type { ConfiguratorSession, SelectionMap } from "@/types/configurator";
import type { StoredSelection } from "@/types/stored-selection";

export function buildApiSelections(
  session: ConfiguratorSession,
  custom: SelectionMap,
): StoredSelection[] {
  return session.cameras
    .map((cam) => {
      const slot = cam.slot || cam.name;
      const fallback = session.defaults?.find((d) => d.slot === slot);
      const applied = custom[slot];
      const meshId = applied?.meshId || fallback?.meshId || "";
      const materialId = applied
        ? applied.materialId || null
        : fallback?.materialId || null;
      return {
        camera_zone_id: cam.zoneId || "",
        camera_id: applied?.cameraId || cam.name,
        mesh_id: meshId,
        material_id: materialId || null,
      };
    })
    .filter((row) => row.camera_id && row.mesh_id);
}

export function customMapToStored(
  session: ConfiguratorSession | null | undefined,
  custom: SelectionMap,
): StoredSelection[] {
  return Object.entries(custom).map(([slot, value]) => {
    const cam = session?.cameras.find(
      (c) => c.slot === slot || c.name === slot,
    );
    return {
      camera_zone_id: cam?.zoneId || "",
      camera_id: value.cameraId || cam?.name || slot,
      mesh_id: value.meshId,
      material_id: value.materialId || null,
    };
  });
}

export function storedToSelectionMap(
  list: StoredSelection[],
): SelectionMap {
  const map: SelectionMap = {};
  for (const row of list) {
    if (!row.camera_id || !row.mesh_id) continue;
    map[row.camera_id] = {
      meshId: row.mesh_id,
      materialId: row.material_id ?? "",
      cameraId: row.camera_id,
    };
  }
  return map;
}

export function isLegacySelectionEntry(
  value: unknown,
): value is { slot: string; meshId: string; materialId?: string; cameraId?: string } {
  if (!value || typeof value !== "object") return false;
  const row = value as { slot?: unknown; meshId?: unknown };
  return typeof row.slot === "string" && typeof row.meshId === "string";
}

export function normalizeStoredSelections(raw: unknown): StoredSelection[] {
  if (!Array.isArray(raw)) return [];
  const out: StoredSelection[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (typeof row.camera_id === "string" && typeof row.mesh_id === "string") {
      out.push({
        camera_zone_id: String(row.camera_zone_id ?? ""),
        camera_id: row.camera_id,
        mesh_id: row.mesh_id,
        material_id:
          row.material_id == null || row.material_id === ""
            ? null
            : String(row.material_id),
      });
      continue;
    }
    if (isLegacySelectionEntry(item)) {
      out.push({
        camera_zone_id: "",
        camera_id: item.cameraId || item.slot,
        mesh_id: item.meshId,
        material_id: item.materialId || null,
      });
    }
  }
  return out;
}
