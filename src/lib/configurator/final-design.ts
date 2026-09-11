/**
 * Final Design stills: room grouping from UE CaptureCamerasHighRes.
 * Map by camera NAME (UE capture indexes ≠ mesh-rules indexes).
 */
import type {
  ConfiguratorSession,
  MaterialOption,
  MeshRulesConfig,
  RoomRenderCard,
  SelectionEntry,
} from "@/types/configurator";
import { estimatePriceFromSession } from "@/lib/configurator/pricing";
import {
  getCatalogZones,
  zoneDisplayLabel,
  zoneIdFromCamera,
  zoneIdFromSlot,
} from "@/lib/configurator/zone-catalog";

export const FINAL_STILL_WIDTH = 1920;
export const FINAL_STILL_HEIGHT = 1080;
export const FINAL_MAX_ATTEMPTS = 3;
export const FINAL_STARTED_MS = 8000;
export const FINAL_COMPLETED_MS = 45000;
export const FINAL_UPLOAD_MS = 12000;

export function catalogCaptureCameras(
  rules?: MeshRulesConfig,
): Array<{ name: string; index: number; zoneId?: string }> {
  const cameras = rules?.cameras ?? [];
  if (cameras.length) {
    return cameras.map((c, i) => ({
      name: c.name,
      index: c.index != null ? Number(c.index) : i,
      zoneId: c.zoneId,
    }));
  }
  return getCatalogZones().flatMap((z, zi) =>
    z.cameras.map((c, i) => ({
      name: c.name,
      index: zi * 10 + i,
      zoneId: z.id,
    })),
  );
}

export const UE_CAPTURE_CAMERAS: Array<{ name: string; index: number }> = [];

export function captureCamerasForZone(
  zoneId: string,
  rules?: MeshRulesConfig,
) {
  return catalogCaptureCameras(rules).filter((c) => {
    if (c.zoneId) return c.zoneId === zoneId;
    return zoneIdFromCamera({ name: c.name }) === zoneId;
  });
}

export function heroCaptureCamera(zoneId: string, rules?: MeshRulesConfig) {
  const list = captureCamerasForZone(zoneId, rules);
  const tv = list.find((c) => c.name.toUpperCase().includes("-TV"));
  return tv ?? list[0] ?? null;
}

export type ReviewMaterialLine = {
  slot: string;
  slotLabel: string;
  meshId: string;
  materialId: string;
  materialName: string;
  thumbnailUrl?: string;
  price: number;
};

export type ReviewRoomGroup = {
  zoneId: string;
  label: string;
  lines: ReviewMaterialLine[];
  subtotal: number;
};

export function buildRoomCards(rules?: MeshRulesConfig): RoomRenderCard[] {
  const cards: RoomRenderCard[] = [];
  const zones = getCatalogZones();
  for (const zone of zones) {
    const cams = captureCamerasForZone(zone.id, rules);
    const hero = heroCaptureCamera(zone.id, rules);
    if (!hero) continue;
    cards.push({
      zoneId: zone.id,
      label: zoneDisplayLabel(zone.id),
      ueZone: zone.ueZone,
      heroCameraName: hero.name,
      heroCameraIndex: hero.index,
      status: "queued",
      attempt: 0,
      stills: cams.map((c) => ({
        cameraName: c.name,
        cameraIndex: c.index,
      })),
    });
  }
  return cards;
}

/** Map Cam_0.png / Cam-13.png onto the UE capture list. */
export function captureCameraFromFile(file?: string | null) {
  if (!file) return null;
  const m = /(?:^|[\\/])Cam[_-]?(\d+)\.(?:png|jpe?g|webp)$/i.exec(file.trim());
  if (!m) return null;
  const index = Number(m[1]);
  return UE_CAPTURE_CAMERAS.find((c) => c.index === index) ?? null;
}

/** Always resolve by camera name first — capture indexes ≠ mesh-rules indexes. */
export function resolveCaptureCamera(args: {
  name?: string;
  index?: number;
  file?: string;
}): { name: string; index: number } | null {
  const name = args.name?.trim();
  const catalog = catalogCaptureCameras();
  if (name) {
    const fromName = catalog.find(
      (c) => c.name.toUpperCase() === name.toUpperCase(),
    );
    if (fromName) return fromName;
  }
  if (args.index != null) {
    const fromIndex = catalog.find(
      (c) => Number(c.index) === Number(args.index),
    );
    if (fromIndex) return fromIndex;
  }
  return captureCameraFromFile(args.file) ?? captureCameraFromFile(name);
}

export function zoneIdForCaptureCamera(
  cameraName: string | undefined,
  cameraIndex?: number,
  _rules?: MeshRulesConfig,
  file?: string,
): string | null {
  void _rules;
  const cam = resolveCaptureCamera({
    name: cameraName,
    index: cameraIndex,
    file,
  });
  if (cam) return zoneIdFromCamera({ name: cam.name });
  if (cameraName) return zoneIdFromCamera({ name: cameraName });
  return null;
}

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

export function reviewGroups(
  session: ConfiguratorSession,
  selections: SelectionEntry[],
): { rooms: ReviewRoomGroup[]; total: number } {
  const byZone = new Map<string, ReviewMaterialLine[]>();
  const matById = new Map<string, MaterialOption>(
    session.materials.map((m) => [m.id, m]),
  );

  for (const sel of selections) {
    const zoneId = zoneIdFromSlot(sel.slot) ?? sel.slot;
    const mat = matById.get(sel.materialId);
    const line: ReviewMaterialLine = {
      slot: sel.slot,
      slotLabel: session.slotLabels[sel.slot] ?? sel.slot,
      meshId: sel.meshId,
      materialId: sel.materialId,
      materialName: mat?.displayName ?? sel.materialId ?? "Mesh only",
      thumbnailUrl: mat?.thumbnailUrl,
      price: linePrice(session, sel),
    };
    const list = byZone.get(zoneId) ?? [];
    list.push(line);
    byZone.set(zoneId, list);
  }

  const rooms: ReviewRoomGroup[] = [];
  for (const zone of getCatalogZones()) {
    const lines = byZone.get(zone.id);
    if (!lines?.length) continue;
    rooms.push({
      zoneId: zone.id,
      label: zoneDisplayLabel(zone.id),
      lines,
      subtotal: lines.reduce((sum, l) => sum + l.price, 0),
    });
  }
  for (const [zoneId, lines] of byZone) {
    if (rooms.some((r) => r.zoneId === zoneId)) continue;
    rooms.push({
      zoneId,
      label: zoneDisplayLabel(zoneId),
      lines,
      subtotal: lines.reduce((sum, l) => sum + l.price, 0),
    });
  }

  return {
    rooms,
    total: estimatePriceFromSession(session, selections),
  };
}

export function revokeUrl(url?: string) {
  if (url?.startsWith("blob:")) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  }
}

export function newCaptureJobId(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `fd-${Date.now().toString(36)}-${rand}`;
}

/** Tiny labeled JPEG for MOCK_UE — not a 1080p buffer. */
export function mockStillJpeg(label: string): string {
  if (typeof document === "undefined") return "";
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.fillStyle = "#14343A";
  ctx.fillRect(0, 0, 640, 360);
  ctx.fillStyle = "#1C4E56";
  ctx.fillRect(24, 24, 592, 312);
  ctx.fillStyle = "#F5F0E8";
  ctx.font = "600 28px Georgia, serif";
  ctx.fillText(label, 48, 180);
  ctx.font = "14px system-ui, sans-serif";
  ctx.fillStyle = "rgba(245,240,232,0.65)";
  ctx.fillText("Preview still  ·  mock capture", 48, 214);
  return canvas.toDataURL("image/jpeg", 0.72);
}
