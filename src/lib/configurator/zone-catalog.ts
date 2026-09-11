/**
 * Catalog-driven zones. Populated when layout catalog loads.
 * Display names and ids come from the backend catalog (name / ue_id).
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

function sameId(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function matchZoneId(
  zone: string | null | undefined,
  zones: ZoneDefinition[] = catalogZones,
): string | null {
  if (!zone) return null;
  const raw = zone.trim();
  if (!raw) return null;
  for (const z of zones) {
    if (
      sameId(z.id, raw) ||
      sameId(z.ueZone, raw) ||
      sameId(z.label, raw)
    ) {
      return z.id;
    }
  }
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
  const name = (camera.name ?? "").trim();
  const mode = (camera.mode ?? "").trim();
  for (const z of zones) {
    if (name && z.cameras.some((c) => sameId(c.name, name))) return z.id;
    if (mode && z.cameras.some((c) => sameId(c.mode, mode))) return z.id;
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
  return camera.name?.trim() || "Camera";
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
  return cameraDisplayLabel(camera);
}

export function shortSurfaceLabel(label: string): string {
  return label;
}

export function finishTypeDisplayName(mesh: {
  id: string;
  displayName?: string;
}): string {
  const raw = mesh.displayName?.trim();
  return raw || mesh.id;
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
  return z ? z.label : zoneId;
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
    if (z.cameras.some((c) => c.name === slot || c.mode === slot)) {
      return z.id;
    }
  }
  return zoneIdFromCamera({ name: slot });
}
