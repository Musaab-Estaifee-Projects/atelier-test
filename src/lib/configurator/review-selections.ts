import type {
  ConfiguratorSession,
  MaterialOption,
  SelectionEntry,
} from "@/types/configurator";
import { linePrice } from "@/lib/configurator/final-design";

export type ReviewSurfaceLine = {
  slot: string;
  surfaceLabel: string;
  selected: boolean;
  meshOnly?: boolean;
  materialName?: string;
  materialDetail?: string;
  thumbnailUrl?: string;
  fallbackSwatch?: "wood" | "marble";
  /** Mesh area in m² when known; omitted if unselected or unavailable. */
  areaSqm?: number;
  price: number;
};

export type ReviewSection = {
  id: string;
  label: string;
  lines: ReviewSurfaceLine[];
  subtotal: number;
};

type SurfaceDef = { slot: string; label: string };

const REVIEW_SURFACES: Array<{ id: string; label: string; surfaces: SurfaceDef[] }> = [
  {
    id: "LivingArea",
    label: "Living Room",
    surfaces: [
      { slot: "living-tv-wall", label: "TV unit wall" },
      { slot: "living-sofa-wall", label: "Sofa wall" },
      { slot: "living-ceiling", label: "Ceiling" },
      { slot: "living-floor", label: "Floor" },
    ],
  },
  {
    id: "doors",
    label: "Doors",
    surfaces: [{ slot: "doors-material", label: "Door material" }],
  },
  {
    id: "Kitchen",
    label: "Kitchen",
    surfaces: [
      { slot: "kitchen-cabinets", label: "Kitchen cabinet" },
      { slot: "kitchen-island", label: "Kitchen island" },
      { slot: "kitchen-partition", label: "Kitchen partition" },
    ],
  },
  {
    id: "bedroom-1",
    label: "Bedroom 01",
    surfaces: [
      { slot: "bedroom-01-tv", label: "TV unit wall" },
      { slot: "bedroom-01-headboard", label: "Bed headboard" },
      { slot: "bedroom-01-wardrobe", label: "Wardrobe" },
      { slot: "bedroom-01-floor", label: "Floor" },
    ],
  },
  {
    id: "bedroom-2",
    label: "Bedroom 02",
    surfaces: [
      { slot: "bedroom-02-tv", label: "TV unit wall" },
      { slot: "bedroom-02-headboard", label: "Bed headboard" },
      { slot: "bedroom-02-wardrobe", label: "Wardrobe" },
      { slot: "bedroom-02-floor", label: "Floor" },
    ],
  },
];

function swatchForMaterial(mat?: MaterialOption): "wood" | "marble" | undefined {
  const cat = (mat?.category ?? "").toLowerCase();
  if (cat === "floor") return "marble";
  if (mat) return "wood";
  return undefined;
}

export function buildReviewSections(
  session: ConfiguratorSession,
  selections: SelectionEntry[],
): { sections: ReviewSection[]; total: number } {
  const bySlot = new Map(selections.map((s) => [s.slot, s]));
  const matById = new Map(session.materials.map((m) => [m.id, m]));

  const sections: ReviewSection[] = REVIEW_SURFACES.map((group) => {
    const lines: ReviewSurfaceLine[] = group.surfaces.map((surface) => {
      const sel = bySlot.get(surface.slot);
      if (!sel) {
        return {
          slot: surface.slot,
          surfaceLabel: surface.label,
          selected: false,
          price: 0,
        };
      }
      const mat = matById.get(sel.materialId);
      const meshOnly = Boolean(sel.meshId) && !sel.materialId;
      const areaSqm = session.meshAreas.find(
        (a) => a.meshId === sel.meshId,
      )?.areaSqm;
      return {
        slot: surface.slot,
        surfaceLabel: surface.label,
        selected: true,
        meshOnly,
        materialName: meshOnly
          ? "Added"
          : (mat?.displayName ?? sel.materialId ?? "Mesh only"),
        thumbnailUrl: mat?.thumbnailUrl,
        fallbackSwatch: meshOnly ? undefined : swatchForMaterial(mat),
        areaSqm,
        price: linePrice(session, sel),
      };
    });
    return {
      id: group.id,
      label: group.label,
      lines,
      subtotal: lines.reduce((sum, l) => sum + l.price, 0),
    };
  });

  return {
    sections,
    total: sections.reduce((sum, s) => sum + s.subtotal, 0),
  };
}

export function reviewUnitSubtitle(unitId?: string | null, levelName?: string | null) {
  if (unitId?.includes("2BHK")) return "REEF 997 - 2 Bedrooms - Type A";
  return [unitId, levelName].filter(Boolean).join(" - ") || "Your residence";
}
