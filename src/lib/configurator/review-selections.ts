import type {
  ConfiguratorSession,
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
  thumbnailUrl?: string | null;
  meshImage?: string | null;
  areaSqm?: number;
  price: number;
};

export type ReviewSection = {
  id: string;
  label: string;
  lines: ReviewSurfaceLine[];
  subtotal: number;
};

export function buildReviewSections(
  session: ConfiguratorSession,
  selections: SelectionEntry[],
): { sections: ReviewSection[]; total: number } {
  const bySlot = new Map(selections.map((s) => [s.slot, s]));
  const matById = new Map(session.materials.map((m) => [m.id, m]));
  const meshById = new Map(session.meshes.map((m) => [m.id, m]));

  const sections: ReviewSection[] = session.zones.map((zone) => {
    const lines: ReviewSurfaceLine[] = zone.cameras.map((cam) => {
      const slot = cam.name;
      const sel = bySlot.get(slot);
      const label = session.slotLabels[slot] ?? cam.mode;
      if (!sel) {
        return {
          slot,
          surfaceLabel: label,
          selected: false,
          price: 0,
        };
      }
      const mat = matById.get(sel.materialId);
      const mesh = meshById.get(sel.meshId);
      const meshOnly = Boolean(sel.meshId) && !sel.materialId;
      const areaSqm = session.meshAreas.find(
        (a) => a.meshId === sel.meshId,
      )?.areaSqm;
      return {
        slot,
        surfaceLabel: label,
        selected: true,
        meshOnly,
        materialName: meshOnly
          ? "Added"
          : (mat?.displayName ?? sel.materialId ?? "Mesh only"),
        thumbnailUrl: mat?.thumbnailUrl ?? null,
        meshImage: mesh?.thumbnailUrl ?? null,
        areaSqm,
        price: linePrice(session, sel),
      };
    });
    return {
      id: zone.id,
      label: zone.label,
      lines,
      subtotal: lines.reduce((sum, l) => sum + l.price, 0),
    };
  });

  return {
    sections,
    total: sections.reduce((sum, s) => sum + s.subtotal, 0),
  };
}

export function buildSelectedItemSections(
  session: ConfiguratorSession | undefined,
  selections: SelectionEntry[],
  slotLabels: Record<string, string> = {},
): ReviewSection[] {
  if (!selections.length) return [];

  if (!session) {
    return [
      {
        id: "all",
        label: "Selections",
        subtotal: 0,
        lines: selections.map((sel) => ({
          slot: sel.slot,
          surfaceLabel: slotLabels[sel.slot] ?? sel.slot,
          selected: true,
          materialName: sel.materialId || "Mesh only",
          price: 0,
        })),
      },
    ];
  }

  const { sections } = buildReviewSections(session, selections);
  const used = new Set<string>();
  const selected = sections
    .map((section) => ({
      ...section,
      lines: section.lines.filter((line) => line.selected),
    }))
    .filter((section) => {
      section.lines.forEach((line) => used.add(line.slot));
      return section.lines.length > 0;
    });

  const extras = selections.filter((sel) => !used.has(sel.slot));
  if (!extras.length) return selected;

  const matById = new Map(session.materials.map((m) => [m.id, m]));
  selected.push({
    id: "other",
    label: "Other",
    subtotal: 0,
    lines: extras.map((sel) => {
      const mat = matById.get(sel.materialId);
      const mesh = session.meshes.find((m) => m.id === sel.meshId);
      return {
        slot: sel.slot,
        surfaceLabel: slotLabels[sel.slot] ?? sel.slot,
        selected: true,
        materialName: mat?.displayName ?? sel.materialId ?? "Mesh only",
        thumbnailUrl: mat?.thumbnailUrl ?? mesh?.thumbnailUrl ?? null,
        meshImage: mesh?.thumbnailUrl ?? null,
        price: 0,
      };
    }),
  });

  return selected;
}

export { residenceSubtitle as reviewUnitSubtitle } from "@/lib/configurator/residence-label";
