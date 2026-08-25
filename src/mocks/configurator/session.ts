import { MESH_MATERIALS } from "@/lib/configurator/materials";
import { DEFAULT_MESH_RULES } from "@/lib/configurator/mesh-rules";
import type {
  ConfiguratorSession,
  MaterialOption,
  MeshArea,
  MeshOption,
  SelectionEntry,
} from "@/types/configurator";

const SLOT_LABELS: Record<string, string> = {
  "living-tv-wall": "TV Wall",
  "living-ceiling": "Living Ceiling",
  "living-floor": "Living Floor",
  "living-sofa-wall": "Sofa Wall",
  "kitchen-cabinets": "Kitchen Cabinets",
  "kitchen-island": "Kitchen Island",
  "kitchen-partition": "Glass Partition",
  "bedroom-01-tv": "Bedroom 01 TV",
  "bedroom-01-headboard": "Bedroom 01 Headboard",
  "bedroom-01-wardrobe": "Bedroom 01 Wardrobe",
  "bedroom-01-floor": "Bedroom 01 Floor",
  "bedroom-02-tv": "Bedroom 02 TV",
  "bedroom-02-headboard": "Bedroom 02 Headboard",
  "bedroom-02-wardrobe": "Bedroom 02 Wardrobe",
  "bedroom-02-floor": "Bedroom 02 Floor",
};

/** Infer selection slot from mesh id patterns used in Atelier rules. */
export function slotFromMeshId(meshId: string): string {
  if (meshId.startsWith("MSH-LV-TV")) return "living-tv-wall";
  if (meshId.startsWith("MSH-LV-CL")) return "living-ceiling";
  if (meshId.startsWith("MSH-LV-FL")) return "living-floor";
  if (meshId.toLowerCase().includes("sofa")) return "living-sofa-wall";
  if (meshId.startsWith("MSH-KT-CB")) return "kitchen-cabinets";
  if (meshId.startsWith("MSH-KT-IS")) return "kitchen-island";
  if (meshId.startsWith("MSH-KT-PT")) return "kitchen-partition";
  if (meshId.startsWith("MSH-BR-01-TV")) return "bedroom-01-tv";
  if (meshId.startsWith("MSH-BR-01-HB")) return "bedroom-01-headboard";
  if (meshId.startsWith("MSH-BR-01-WD")) return "bedroom-01-wardrobe";
  if (meshId.startsWith("MSH-BR-01-FL")) return "bedroom-01-floor";
  if (meshId.startsWith("MSH-BR-02-TV")) return "bedroom-02-tv";
  if (meshId.startsWith("MSH-BR-02-HB")) return "bedroom-02-headboard";
  if (meshId.startsWith("MSH-BR-02-WD")) return "bedroom-02-wardrobe";
  if (meshId.startsWith("MSH-BR-02-FL")) return "bedroom-02-floor";
  return `slot-${meshId}`;
}

export function slotFromCamera(
  name: string,
  mode?: string,
): string | undefined {
  const key = `${name} ${mode ?? ""}`.toLowerCase();
  if (
    name.startsWith("CAM-LV-SW") ||
    key.includes("sofa") ||
    mode?.includes("Sofa")
  )
    return "living-sofa-wall";
  if (key.includes("tv") && key.includes("living")) return "living-tv-wall";
  if (key.includes("ceiling")) return "living-ceiling";
  if (key.includes("floor") && key.includes("living")) return "living-floor";
  if (key.includes("sofa")) return "living-sofa-wall";
  if (key.includes("kitchen") && key.includes("cab")) return "kitchen-cabinets";
  if (key.includes("island")) return "kitchen-island";
  if (key.includes("partition") || key.includes("glass"))
    return "kitchen-partition";
  if (key.includes("br-01") || key.includes("bedroom 01")) {
    if (key.includes("tv")) return "bedroom-01-tv";
    if (key.includes("hb") || key.includes("head"))
      return "bedroom-01-headboard";
    if (key.includes("wd") || key.includes("ward"))
      return "bedroom-01-wardrobe";
    if (key.includes("fl") || key.includes("floor")) return "bedroom-01-floor";
  }
  if (key.includes("br-02") || key.includes("bedroom 02")) {
    if (key.includes("tv")) return "bedroom-02-tv";
    if (key.includes("hb") || key.includes("head"))
      return "bedroom-02-headboard";
    if (key.includes("wd") || key.includes("ward"))
      return "bedroom-02-wardrobe";
    if (key.includes("fl") || key.includes("floor")) return "bedroom-02-floor";
  }
  // Fallback by camera name prefixes from mesh-rules
  if (name.startsWith("CAM-LV-TV")) return "living-tv-wall";
  if (name.startsWith("CAM-LV-CL")) return "living-ceiling";
  if (name.startsWith("CAM-LV-FL")) return "living-floor";
  if (name.startsWith("CAM-LV-KT")) return "kitchen-cabinets";
  if (name.startsWith("CAM-LV-PT")) return "kitchen-partition";
  if (
    name.startsWith("CAM-LV-SW") ||
    name.includes("sofa") ||
    mode?.includes("Sofa")
  )
    return "living-sofa-wall";
  return undefined;
}

const MATERIAL_META: Record<
  string,
  { displayName: string; category: string; pricePerSqm: number }
> = {
  "MT-TW0001": {
    displayName: "Oak Cladding",
    category: "wood",
    pricePerSqm: 85,
  },
  "MT-TW0002": {
    displayName: "Walnut Cladding",
    category: "wood",
    pricePerSqm: 95,
  },
  "MT-WP0001": {
    displayName: "Linen Wallpaper",
    category: "wallpaper",
    pricePerSqm: 45,
  },
  "MT-WP0002": {
    displayName: "Geo Wallpaper",
    category: "wallpaper",
    pricePerSqm: 52,
  },
  "MT-WP0003": {
    displayName: "Botanical Wallpaper",
    category: "wallpaper",
    pricePerSqm: 58,
  },
  "MT-WP0004": {
    displayName: "Stripe Wallpaper",
    category: "wallpaper",
    pricePerSqm: 48,
  },
  "MT-WP0005": {
    displayName: "Texture Wallpaper",
    category: "wallpaper",
    pricePerSqm: 55,
  },
  "MT-PC0001": {
    displayName: "Matte White",
    category: "paint",
    pricePerSqm: 35,
  },
  "MT-PC0002": { displayName: "Soft Grey", category: "paint", pricePerSqm: 38 },
  "MT-PC0003": {
    displayName: "Sage Green",
    category: "paint",
    pricePerSqm: 42,
  },
  "MT-PC0004": { displayName: "Navy", category: "paint", pricePerSqm: 44 },
  "MT-PC0005": { displayName: "Warm Sand", category: "paint", pricePerSqm: 40 },
  "MT-FL0001": {
    displayName: "Oak Parquet",
    category: "floor",
    pricePerSqm: 120,
  },
  "MT-FL0002": {
    displayName: "Ash Parquet",
    category: "floor",
    pricePerSqm: 115,
  },
  "MT-FL0003": {
    displayName: "Carrara Marble",
    category: "floor",
    pricePerSqm: 180,
  },
  "MT-FL0004": {
    displayName: "Grey Marble",
    category: "floor",
    pricePerSqm: 165,
  },
  "MT-FL0005": {
    displayName: "Cream Marble",
    category: "floor",
    pricePerSqm: 170,
  },
  "MT-FL0006": {
    displayName: "White Porcelain",
    category: "floor",
    pricePerSqm: 90,
  },
  "MT-FL0007": {
    displayName: "Graphite Porcelain",
    category: "floor",
    pricePerSqm: 95,
  },
  "MT-FL0008": {
    displayName: "Beige Porcelain",
    category: "floor",
    pricePerSqm: 92,
  },
  "MT-CL0001": {
    displayName: "Ceiling White",
    category: "ceiling",
    pricePerSqm: 25,
  },
  "MT-CL0002": {
    displayName: "Ceiling Soft",
    category: "ceiling",
    pricePerSqm: 28,
  },
  "MT-CL0003": {
    displayName: "Ceiling Warm",
    category: "ceiling",
    pricePerSqm: 30,
  },
  "MT-GWD001": {
    displayName: "Glass Wardrobe",
    category: "wardrobe",
    pricePerSqm: 140,
  },
};

const DEFAULT_MESH_AREAS: MeshArea[] = [
  { meshId: "MSH-LV-TV-0002", areaSqm: 8 },
  { meshId: "MSH-LV-TV-0003", areaSqm: 8 },
  { meshId: "MSH-LV-TV-0004", areaSqm: 8 },
  { meshId: "MSH-LV-CL-0001", areaSqm: 22 },
  { meshId: "MSH-LV-CL-0002", areaSqm: 22 },
  { meshId: "MSH-LV-CL-0003", areaSqm: 22 },
  { meshId: "MSH-LV-FL-0002", areaSqm: 28 },
  { meshId: "MSH-LV-FL-0003", areaSqm: 28 },
  { meshId: "MSH-LV-FL-0004", areaSqm: 28 },
  { meshId: "MSH-LV-sofa wall-0002", areaSqm: 7 },
  { meshId: "MSH-LV-sofa wall-0003", areaSqm: 7 },
  { meshId: "MSH-LV-sofa wall-0004", areaSqm: 7 },
  { meshId: "MSH-KT-CB-0001", areaSqm: 12 },
  { meshId: "MSH-KT-IS-0001", areaSqm: 4 },
  { meshId: "MSH-KT-PT-0001", areaSqm: 3 },
  { meshId: "MSH-KT-PT-0002", areaSqm: 3 },
  { meshId: "MSH-BR-01-FL-0001", areaSqm: 14 },
  { meshId: "MSH-BR-01-FL-0002", areaSqm: 14 },
  { meshId: "MSH-BR-01-FL-0003", areaSqm: 14 },
  { meshId: "MSH-BR-02-FL-0001", areaSqm: 12 },
  { meshId: "MSH-BR-02-FL-0002", areaSqm: 12 },
  { meshId: "MSH-BR-02-FL-0003", areaSqm: 12 },
];

function buildMaterialsCatalog(): MaterialOption[] {
  const ids = new Set<string>();
  for (const list of Object.values(MESH_MATERIALS)) {
    for (const id of list) ids.add(id);
  }
  return [...ids].map((id) => {
    const meta = MATERIAL_META[id];
    return {
      id,
      displayName: meta?.displayName ?? id,
      category: meta?.category,
      pricePerSqm: meta?.pricePerSqm ?? 50,
    };
  });
}

function enrichCameras() {
  return DEFAULT_MESH_RULES.cameras.map((c) => ({
    ...c,
    slot: c.slot ?? slotFromCamera(c.name, c.mode),
  }));
}

function enrichMeshes(): MeshOption[] {
  return DEFAULT_MESH_RULES.meshes.map((m) => ({
    ...m,
    slot: slotFromMeshId(m.id),
    displayName: m.displayName || m.id,
  }));
}

/** First catalog mesh (+ first allowed material) for a slot — UE default. */
export function defaultEntryForSlot(
  session: {
    meshes: MeshOption[];
    materialsByMesh: Record<string, string[]>;
    defaults?: SelectionEntry[];
  },
  slot: string,
): SelectionEntry | null {
  const fromDefaults = session.defaults?.find((d) => d.slot === slot);
  if (fromDefaults) return fromDefaults;
  const mesh = session.meshes.find(
    (m) => (m.slot || slotFromMeshId(m.id)) === slot,
  );
  if (!mesh) return null;
  const mats = session.materialsByMesh[mesh.id] ?? [];
  return {
    slot,
    meshId: mesh.id,
    materialId: mats[0] ?? "",
  };
}

/** MOCK: unit session catalog (swap for GET /api/configurator/session). */
export function buildMockSession(args: {
  unitId: string;
  streamProjectId: string;
  levelName?: string;
}): ConfiguratorSession {
  const levelName = args.levelName?.trim() || "2BHK_Type_2_Updated";

  return {
    streamProjectId: args.streamProjectId,
    unitId: args.unitId,
    levelName,
    cameras: enrichCameras(),
    meshes: enrichMeshes(),
    materials: buildMaterialsCatalog(),
    materialsByMesh: { ...MESH_MATERIALS },
    meshAreas: DEFAULT_MESH_AREAS,
    slotLabels: SLOT_LABELS,
    defaults: [],
  };
}

export { SLOT_LABELS };
