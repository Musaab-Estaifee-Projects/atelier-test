/**
 * Catalog-driven zones. Populated when layout catalog loads.
 */
import type {
  CameraRule,
  MeshRulesConfig,
  ZoneDefinition,
} from "@/types/configurator";

let catalogZones: ZoneDefinition[] = [];

export function setActiveCatalogZones(zones: ZoneDefinition[]): void {
  catalogZones = zones;
}

export function getCatalogZones(): ZoneDefinition[] {
  return catalogZones;
}

/** Live catalog zones (empty until session maps). */
export function CONFIGURATOR_ZONES(): ZoneDefinition[] {
  return catalogZones;
}

function norm(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
}

export function matchZoneId(
  zone: string | null | undefined,
  zones: ZoneDefinition[] = catalogZones,
): string | null {
  if (!zone) return null;
  const n = norm(zone);
  const raw = zone.trim();
  for (const z of zones) {
    if (z.id === raw || z.ueZone === raw) return z.id;
    if (norm(z.id) === n || norm(z.ueZone) === n) return z.id;
    if (z.aliases.some((a) => norm(a) === n || n.includes(norm(a)))) {
      return z.id;
    }
  }
  if (raw.toUpperCase().startsWith("ZONE-")) return raw;
  return null;
}

export function zoneIdForCamera(camera: {
  name?: string;
  mode?: string;
  zoneId?: string;
}): string | null {
  if (camera.zoneId) return matchZoneId(camera.zoneId) ?? camera.zoneId;
  return zoneIdFromCamera(camera);
}

export function zoneIdFromCamera(
  camera: { name?: string; mode?: string } | null | undefined,
  zones: ZoneDefinition[] = catalogZones,
): string | null {
  if (!camera?.name && !camera?.mode) return null;
  const name = (camera.name ?? "").toUpperCase();
  const mode = (camera.mode ?? "").toLowerCase();
  for (const z of zones) {
    if (z.cameras.some((c) => c.name.toUpperCase() === name)) return z.id;
    if (mode && z.cameras.some((c) => c.mode.toLowerCase() === mode)) {
      return z.id;
    }
  }
  if (name.includes("KT")) {
    const kitchen = zones.find((z) => /kitchen/i.test(z.label));
    if (kitchen) return kitchen.id;
  }
  return null;
}

export function camerasForZone(
  zoneId: string,
  rules: MeshRulesConfig,
): CameraRule[] {
  const id = matchZoneId(zoneId) ?? zoneId;
  const fromRules = rules.cameras.filter(
    (c) => c.zoneId === id || c.zoneId === zoneId,
  );
  if (fromRules.length) {
    return fromRules.map((cam) => ({
      ...cam,
      slot: cam.slot ?? cam.name,
    }));
  }

  const def = catalogZones.find((z) => z.id === id);
  if (!def) return [];
  return def.cameras.map((ref) => {
    const cam = rules.cameras.find((c) => c.name === ref.name);
    return {
      name: ref.name,
      mode: cam?.mode ?? ref.mode,
      meshIds: cam?.meshIds ?? [],
      slot: cam?.slot ?? ref.name,
      zoneId: id,
    };
  });
}

export function zoneCamerasForUi(
  zoneId: string,
  rules: MeshRulesConfig,
): { name: string; index: number; mode?: string }[] {
  return camerasForZone(zoneId, rules).map((c, i) => ({
    name: c.name,
    index: c.index != null ? Number(c.index) : i,
    mode: c.mode,
  }));
}

export function cameraDisplayLabel(camera: {
  name?: string;
  mode?: string;
}): string {
  if (camera.mode?.trim()) return camera.mode.trim();
  return (camera.name ?? "Camera").replace(/^CAM-/, "");
}

export function cameraKey(c: {
  name?: string;
  mode?: string;
  index?: number;
}): string {
  return c.name ?? `${c.mode ?? ""}|${c.index ?? ""}`;
}

export function surfaceDisplayLabel(camera: {
  name?: string;
  mode?: string;
}): string {
  if (camera.mode?.trim()) return camera.mode.trim();
  const name = (camera.name ?? "").toUpperCase();
  if (name.includes("-SW")) return "Sofa Wall";
  if (name.includes("-FL")) return "Floor";
  if (name.includes("-CL")) return "Ceiling";
  if (name.includes("-HB")) return "Headboard";
  if (name.includes("-WD")) return "Wardrobe";
  if (name.includes("-PT")) return "Glass Partition";
  if (name.includes("-KT")) return "Kitchen";
  if (name.includes("-TV")) return "TV Wall";
  if (name.includes("-DR")) return "Door";
  return cameraDisplayLabel(camera);
}

export function shortSurfaceLabel(label: string): string {
  return (
    label
      .replace(/^Living\s+/i, "")
      .replace(/^Bedroom\s+0?\d\s+/i, "")
      .replace(/\s+Cabinets$/i, "")
      .replace(/\s+unit wall$/i, " Wall")
      .trim() || label
  );
}

export function finishTypeDisplayName(mesh: {
  id: string;
  displayName?: string;
}): string {
  const raw = mesh.displayName?.trim();
  if (raw && raw !== mesh.id && !raw.startsWith("MSH-")) return raw;
  return raw || mesh.id.replace(/^MSH-/, "");
}

export function ueZoneName(zoneId: string): string {
  return (
    catalogZones.find((z) => z.id === zoneId || z.ueZone === zoneId)?.ueZone ??
    zoneId
  );
}

export function moveZoneName(zoneId: string | null | undefined): string | null {
  if (!zoneId) return null;
  const id = matchZoneId(zoneId) ?? zoneId;
  return ueZoneName(id);
}

export function zoneDisplayLabel(zoneId: string): string {
  const z = catalogZones.find((item) => item.id === zoneId);
  if (z) {
    if (/living/i.test(z.label) && !/room/i.test(z.label)) {
      return "Living Room";
    }
    return z.label;
  }
  return zoneId;
}

export function heroCameraForZone(
  zoneId: string,
  rules: MeshRulesConfig,
): CameraRule | null {
  const cams = camerasForZone(zoneId, rules);
  return cams[0] ?? null;
}

export type RoomStillTarget = {
  zoneId: string;
  label: string;
  ueZone: string;
  cameraIndex: number;
  cameraName?: string;
};

export function roomStillTargets(rules: MeshRulesConfig): RoomStillTarget[] {
  const list: RoomStillTarget[] = [];
  for (const zone of catalogZones) {
    const hero = heroCameraForZone(zone.id, rules);
    if (!hero) continue;
    list.push({
      zoneId: zone.id,
      label: zoneDisplayLabel(zone.id),
      ueZone: zone.ueZone,
      cameraIndex: hero.index != null ? Number(hero.index) : 0,
      cameraName: hero.name,
    });
  }
  return list;
}

export function zoneIdFromSlot(slot: string): string | null {
  for (const z of catalogZones) {
    if (z.cameras.some((c) => c.name === slot)) return z.id;
  }
  const fromCam = zoneIdFromCamera({ name: slot });
  if (fromCam) return fromCam;
  if (slot.startsWith("living-")) return matchZoneId("ZONE-LV");
  if (slot.startsWith("kitchen-")) return matchZoneId("ZONE-KT");
  if (slot.startsWith("bedroom-01")) return matchZoneId("ZONE-BR-01");
  if (slot.startsWith("bedroom-02")) return matchZoneId("ZONE-BR-02");
  return null;
}
