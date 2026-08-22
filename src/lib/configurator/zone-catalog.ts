// src/lib/configurator/zone-catalog.ts
/**
 * Zones + cameras aligned with mock mesh-rules / UE URL values.
 * Zone ids match real stream query values (e.g. LivingArea, bedroom-1).
 */
import type { CameraRule, MeshRulesConfig } from "@/types/configurator";
import { slotFromCamera } from "@/mocks/configurator/session";

export type ZoneCameraRef = {
  /** Exact camera name from DEFAULT_MESH_RULES */
  name: string;
  /** Exact mode from DEFAULT_MESH_RULES — used as UI label */
  mode: string;
};

export type ZoneDefinition = {
  /** Stable id = primary UE / URL zone string */
  id: string;
  /** Top-bar label (same as mock / UE where possible) */
  label: string;
  /** UE EnterZone / URL zone value */
  ueZone: string;
  /** Alternate strings from UE / old URLs */
  aliases: string[];
  cameras: ZoneCameraRef[];
};

/**
 * Catalog from mock rules + observed UE zones:
 * LivingArea, bedroom-1, bedroom-2 (+ Kitchen grouping for CAM-LV-KT / PT).
 */
export const CONFIGURATOR_ZONES: ZoneDefinition[] = [
  {
    id: "LivingArea",
    label: "LivingArea",
    ueZone: "LivingArea",
    aliases: ["living", "livingarea", "living-area", "living room", "lv"],
    cameras: [
      { name: "CAM-LV-TV", mode: "Living TVWall" },
      { name: "CAM-LV-CL", mode: "LivingCeiling" },
      { name: "CAM-LV-FL", mode: "LivingFloor" },
      { name: "CAM-LV-SW", mode: "LivingSofaWall" },
    ],
  },
  {
    id: "Kitchen",
    label: "Kitchen",
    // Kitchen cameras live in the LivingArea volume in UE (CAM-LV-KT / PT)
    ueZone: "LivingArea",
    aliases: ["kitchen", "kt", "livingkitchen"],
    cameras: [
      { name: "CAM-LV-KT", mode: "LivingKitchen" },
      { name: "CAM-LV-PT", mode: "GlassPartition" },
    ],
  },
  {
    id: "bedroom-1",
    label: "Bedroom 01",
    ueZone: "bedroom-1",
    aliases: ["bedroom-1", "bedroom-01", "bedroom 01", "br-01", "br01"],
    cameras: [
      { name: "CAM-BR-01-TV", mode: "Bedroom 01 TV" },
      { name: "CAM-BR-01-HB", mode: "Bedroom 01 Headboard" },
      { name: "CAM-BR-01-WD", mode: "Bedroom 01 Wardrobe" },
      { name: "CAM-BR-01-FL", mode: "Bedroom 01 Floor" },
    ],
  },
  {
    id: "bedroom-2",
    label: "Bedroom 02",
    ueZone: "bedroom-2",
    aliases: ["bedroom-2", "bedroom-02", "bedroom 02", "br-02", "br02"],
    cameras: [
      { name: "CAM-BR-02-TV", mode: "Bedroom 02 TV" },
      { name: "CAM-BR-02-HB", mode: "Bedroom 02 Headboard" },
      { name: "CAM-BR-02-WD", mode: "Bedroom 02 Wardrobe" },
      { name: "CAM-BR-02-FL", mode: "Bedroom 02 Floor" },
    ],
  },
];

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/[_\s]+/g, "-");
}

export function matchZoneId(zone: string | null | undefined): string | null {
  if (!zone) return null;
  const n = norm(zone);
  for (const z of CONFIGURATOR_ZONES) {
    if (norm(z.id) === n || norm(z.ueZone) === n) return z.id;
    if (z.aliases.some((a) => norm(a) === n || n.includes(norm(a)))) {
      return z.id;
    }
  }
  return null;
}

export function zoneIdFromCamera(
  camera: { name?: string; mode?: string } | null | undefined,
): string | null {
  if (!camera?.name && !camera?.mode) return null;
  const name = (camera.name ?? "").toUpperCase();
  const mode = (camera.mode ?? "").toLowerCase();

  if (name.includes("BR-01") || name.includes("BR_01") || mode.includes("bedroom 01")) {
    return "bedroom-1";
  }
  if (name.includes("BR-02") || name.includes("BR_02") || mode.includes("bedroom 02")) {
    return "bedroom-2";
  }
  if (
    name.includes("CAM-LV-KT") ||
    name.includes("CAM-LV-PT") ||
    mode.includes("kitchen") ||
    mode.includes("partition") ||
    mode.includes("glass")
  ) {
    return "Kitchen";
  }
  if (name.includes("CAM-LV-SW") || mode.includes("sofa")) {
    return "LivingArea";
  }

  const slot = slotFromCamera(camera.name ?? "", camera.mode);
  if (slot?.startsWith("bedroom-01")) return "bedroom-1";
  if (slot?.startsWith("bedroom-02")) return "bedroom-2";
  if (slot?.startsWith("kitchen")) return "Kitchen";
  if (slot?.startsWith("living")) return "LivingArea";
  return null;
}

/** Resolve CameraRule rows for a zone from session / mesh-rules (exact name+mode). */
export function camerasForZone(
  zoneId: string,
  rules: MeshRulesConfig,
): CameraRule[] {
  const def = CONFIGURATOR_ZONES.find((z) => z.id === zoneId);
  if (!def) return [];

  const list: CameraRule[] = [];
  for (const ref of def.cameras) {
    const cam =
      rules.cameras.find(
        (c) => c.name === ref.name && (c.mode ?? "") === ref.mode,
      ) ??
      rules.cameras.find(
        (c) =>
          c.name === ref.name &&
          (c.mode ?? "").toLowerCase() === ref.mode.toLowerCase(),
      );

    if (cam) {
      list.push({
        ...cam,
        mode: cam.mode ?? ref.mode,
        slot: cam.slot ?? slotFromCamera(cam.name, cam.mode ?? ref.mode),
        meshIds: cam.meshIds?.length ? cam.meshIds : [],
      });
    } else {
      list.push({
        name: ref.name,
        mode: ref.mode,
        meshIds: [],
        slot: slotFromCamera(ref.name, ref.mode),
      });
    }
  }
  return list;
}

/** Build ConfiguratorCamera[] for hydrateFromShare from mock rules. */
export function zoneCamerasForUi(
  zoneId: string,
  rules: MeshRulesConfig,
): { name: string; index: number; mode?: string }[] {
  return camerasForZone(zoneId, rules)
    .filter((c) => c.index != null)
    .map((c) => ({
      name: c.name,
      index: Number(c.index),
      mode: c.mode,
    }));
}

/** UI label = exact mock `mode` string. */
export function cameraDisplayLabel(camera: {
  name?: string;
  mode?: string;
}): string {
  if (camera.mode?.trim()) return camera.mode.trim();
  return (camera.name ?? "Camera").replace(/^CAM-/, "");
}

export function ueZoneName(zoneId: string): string {
  return CONFIGURATOR_ZONES.find((z) => z.id === zoneId)?.ueZone ?? zoneId;
}

/**
 * Zone name for UE MoveToZone.
 * Kitchen is its own zone in the Blueprint (not LivingArea).
 */
export function moveZoneName(zoneId: string | null | undefined): string | null {
  if (!zoneId) return null;
  const id = matchZoneId(zoneId) ?? zoneId;
  if (id === "LivingArea") return "LivingArea";
  if (id === "Kitchen") return "Kitchen";
  if (id === "bedroom-1") return "bedroom-1";
  if (id === "bedroom-2") return "bedroom-2";
  return ueZoneName(id);
}

/** Human label for Final Design cards (LivingArea → Living Room). */
export function zoneDisplayLabel(zoneId: string): string {
  if (zoneId === "LivingArea") return "Living Room";
  return CONFIGURATOR_ZONES.find((z) => z.id === zoneId)?.label ?? zoneId;
}

/** First zone camera that has a numeric UE index. */
export function heroCameraForZone(
  zoneId: string,
  rules: MeshRulesConfig,
): CameraRule | null {
  const cams = camerasForZone(zoneId, rules);
  return (
    cams.find(
      (c) => c.index != null && !Number.isNaN(Number(c.index)),
    ) ?? null
  );
}

export type RoomStillTarget = {
  zoneId: string;
  label: string;
  ueZone: string;
  cameraIndex: number;
  cameraName?: string;
};

/** One hero still per catalog zone (skips zones with no indexed camera). */
export function roomStillTargets(rules: MeshRulesConfig): RoomStillTarget[] {
  const list: RoomStillTarget[] = [];
  for (const zone of CONFIGURATOR_ZONES) {
    const hero = heroCameraForZone(zone.id, rules);
    if (hero?.index == null || Number.isNaN(Number(hero.index))) continue;
    list.push({
      zoneId: zone.id,
      label: zoneDisplayLabel(zone.id),
      ueZone: zone.ueZone,
      cameraIndex: Number(hero.index),
      cameraName: hero.name,
    });
  }
  return list;
}

export function zoneIdFromSlot(slot: string): string | null {
  if (slot.startsWith("living-")) return "LivingArea";
  if (slot.startsWith("kitchen-")) return "Kitchen";
  if (slot.startsWith("bedroom-01")) return "bedroom-1";
  if (slot.startsWith("bedroom-02")) return "bedroom-2";
  return null;
}
