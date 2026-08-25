import type { MaterialOption } from "@/types/configurator";

const WOOD_CLADDING = ["MT-TW0001", "MT-TW0002"];
const WALLPAPER = [
  "MT-WP0001",
  "MT-WP0002",
  "MT-WP0003",
  "MT-WP0004",
  "MT-WP0005",
];
const KITCHEN_CABINET = [
  "MT-TW0001",
  "MT-TW0002",
  "MT-PC0001",
  "MT-PC0002",
  "MT-PC0003",
  "MT-PC0004",
  "MT-PC0005",
];
const FLOOR_PARQUET = ["MT-FL0001", "MT-FL0002"];
const FLOOR_MARBLE = ["MT-FL0003", "MT-FL0004", "MT-FL0005"];
const FLOOR_PORCELAIN = ["MT-FL0006", "MT-FL0007", "MT-FL0008"];

/**
 * Mesh → allowed materials (from ATELIER-Rules).
 *
 * FUTURE API:
 *   GET /api/configurator/materials?meshId=MSH-LV-FL-0002
 *   GET /api/configurator/materials-map?unit=LO-APT-2BHK-T02
 */
export const MESH_MATERIALS: Record<string, string[]> = {
  "MSH-LV-TV-0002": WOOD_CLADDING,
  "MSH-LV-TV-0003": WOOD_CLADDING,
  "MSH-LV-TV-0004": WALLPAPER,
  "MSH-LV-CL-0001": ["MT-CL0001"],
  "MSH-LV-CL-0002": ["MT-CL0002"],
  "MSH-LV-CL-0003": ["MT-CL0003"],
  "MSH-LV-FL-0002": FLOOR_PARQUET,
  "MSH-LV-FL-0003": FLOOR_MARBLE,
  "MSH-LV-FL-0004": FLOOR_PORCELAIN,
  "MSH-LV-sofa wall-0002": WOOD_CLADDING,
  "MSH-LV-sofa wall-0003": WOOD_CLADDING,
  "MSH-LV-sofa wall-0004": WALLPAPER,
  "MSH-KT-CB-0001": KITCHEN_CABINET,
  "MSH-KT-IS-0001": KITCHEN_CABINET,
  "MSH-KT-PT-0001": [],
  "MSH-KT-PT-0002": [],
};

const BEDROOM_MESH_SUFFIX_MATERIALS: Record<string, string[]> = {
  "TV-0002": WOOD_CLADDING,
  "TV-0003": WOOD_CLADDING,
  "TV-0004": WALLPAPER,
  "HB-0002": WOOD_CLADDING,
  "HB-0003": WOOD_CLADDING,
  "HB-0004": WALLPAPER,
  "WD-0001": ["MT-GWD001"],
  "FL-0001": FLOOR_PARQUET,
  "FL-0002": FLOOR_MARBLE,
  "FL-0003": FLOOR_PORCELAIN,
};

for (const bedroom of ["01", "02"]) {
  for (const [suffix, materials] of Object.entries(
    BEDROOM_MESH_SUFFIX_MATERIALS,
  )) {
    MESH_MATERIALS[`MSH-BR-${bedroom}-${suffix}`] = materials;
  }
}

export function getMaterialsForMesh(
  meshId: string | null | undefined,
): MaterialOption[] {
  if (!meshId) return [];
  return (MESH_MATERIALS[meshId] || []).map((id) => ({
    id,
    displayName: id,
  }));
}
