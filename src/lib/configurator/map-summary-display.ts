import type {
  DesignSummaryData,
  SummaryCamera,
  SummaryZone,
} from "@/services/post-design-summary.service";

export type SummaryDisplayLine = {
  slot: string;
  surfaceLabel: string;
  meshLabel: string;
  meshSelected: boolean;
  meshImage?: string | null;
  materialLabel: string;
  materialSelected: boolean;
  materialDash: boolean;
  thumbnailUrl?: string | null;
  areaLabel: string;
  price: number;
  priceSelected: boolean;
};

export type SummaryDisplaySection = {
  id: string;
  label: string;
  lines: SummaryDisplayLine[];
  subtotal: number;
};

function amount(value: string | null | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function isDefault(
  item: { is_default: boolean } | null | undefined,
): boolean {
  return !item || item.is_default;
}

export function mapSummaryToDisplay(
  data: DesignSummaryData | null,
): { sections: SummaryDisplaySection[]; total: number } {
  if (!data) return { sections: [], total: 0 };

  const sections = data.items.map((zone) => mapZone(zone));
  return {
    sections,
    total: amount(data.total_amount),
  };
}

function mapZone(zone: SummaryZone): SummaryDisplaySection {
  const lines = zone.cameras.map((camera) => mapCamera(camera));
  return {
    id: zone.camera_zone_id,
    label: zone.camera_zone_name,
    lines,
    subtotal: amount(zone.total_amount),
  };
}

function mapCamera(camera: SummaryCamera): SummaryDisplayLine {
  const hasMaterial = camera.material != null;
  const meshDefault = isDefault(camera.mesh);
  const materialDefault = isDefault(camera.material);
  const materialSelected = hasMaterial && !materialDefault;
  const meshSelected = !meshDefault || materialSelected;
  const price = amount(camera.line_total);

  return {
    slot: camera.camera_id,
    surfaceLabel: camera.camera_name,
    meshLabel: camera.mesh?.name ?? "",
    meshSelected,
    meshImage: camera.mesh?.image ?? null,
    materialLabel: camera.material?.name ?? "",
    materialSelected,
    materialDash: !hasMaterial,
    thumbnailUrl: camera.material?.image ?? null,
    areaLabel: camera.dimension
      ? `${Number(camera.dimension).toLocaleString()} ${camera.unit}`
      : "-",
    price,
    priceSelected: price > 0,
  };
}
