// src/lib/configurator/mesh-rules.ts

import type {
  CameraRule,
  MeshOption,
  MeshRulesConfig,
} from "@/types/configurator";

/**
 * Camera → mesh variant rules (from ATELIER-Rules CSVs).
 *
 * FUTURE API:
 * GET /api/configurator/mesh-rules?unit={unitId}&level={levelName}
 * → MeshRulesConfig
 *
 * Keep this file as the fallback until the backend is ready.
 * Prefer matching by `index` when UE sends numeric indexes; fall back to name/mode.
 */
export const DEFAULT_MESH_RULES: MeshRulesConfig = {
  cameras: [
    {
      index: 0,
      name: "CAM-LV-TV",
      mode: "Living TVWall",
      meshIds: [
        "MSH-LV-TV-0001",
        "MSH-LV-TV-0002",
        "MSH-LV-TV-0003",
        "MSH-LV-TV-0004",
      ],
    },
    {
      index: 1,
      name: "CAM-LV-CL",
      mode: "LivingCeiling",
      meshIds: ["MSH-LV-CL-0001", "MSH-LV-CL-0002", "MSH-LV-CL-0003"],
    },
    {
      index: 2,
      name: "CAM-LV-FL",
      mode: "LivingFloor",
      meshIds: [
        "MSH-LV-FL-0001",
        "MSH-LV-FL-0002",
        "MSH-LV-FL-0003",
        "MSH-LV-FL-0004",
      ],
    },
    {
      index: 3,
      name: "CAM-LV-KT",
      mode: "LivingKitchen",
      meshIds: ["MSH-KT-CB-0001", "MSH-KT-IS-0001"],
    },
    {
      index: 12,
      name: "CAM-LV-PT",
      mode: "GlassPartition",
      meshIds: ["MSH-KT-PT-0001", "MSH-KT-PT-0002"],
    },
    {
      index: 13,
      name: "CAM-LV-SW",
      mode: "LivingSofaWall",
      meshIds: [
        "MSH-LV-sofa wall-0001",
        "MSH-LV-sofa wall-0002",
        "MSH-LV-sofa wall-0003",
        "MSH-LV-sofa wall-0004",
      ],
    },
    {
      index: 4,
      name: "CAM-BR-01-TV",
      mode: "Bedroom 01 TV",
      meshIds: [
        "MSH-BR-01-TV-0001",
        "MSH-BR-01-TV-0002",
        "MSH-BR-01-TV-0003",
        "MSH-BR-01-TV-0004",
      ],
    },
    {
      index: 5,
      name: "CAM-BR-01-HB",
      mode: "Bedroom 01 Headboard",
      meshIds: [
        "MSH-BR-01-HB-0001",
        "MSH-BR-01-HB-0002",
        "MSH-BR-01-HB-0003",
        "MSH-BR-01-HB-0004",
      ],
    },
    {
      index: 6,
      name: "CAM-BR-01-WD",
      mode: "Bedroom 01 Wardrobe",
      meshIds: ["MSH-BR-01-WD-0001", "MSH-BR-01-WD-0002"],
    },
    {
      index: 7,
      name: "CAM-BR-01-FL",
      mode: "Bedroom 01 Floor",
      meshIds: ["MSH-BR-01-FL-0001", "MSH-BR-01-FL-0002", "MSH-BR-01-FL-0003"],
    },
    {
      index: 8,
      name: "CAM-BR-02-TV",
      mode: "Bedroom 02 TV",
      meshIds: [
        "MSH-BR-02-TV-0001",
        "MSH-BR-02-TV-0002",
        "MSH-BR-02-TV-0003",
        "MSH-BR-02-TV-0004",
      ],
    },
    {
      index: 9,
      name: "CAM-BR-02-HB",
      mode: "Bedroom 02 Headboard",
      meshIds: [
        "MSH-BR-02-HB-0001",
        "MSH-BR-02-HB-0002",
        "MSH-BR-02-HB-0003",
        "MSH-BR-02-HB-0004",
      ],
    },
    {
      index: 10,
      name: "CAM-BR-02-WD",
      mode: "Bedroom 02 Wardrobe",
      meshIds: ["MSH-BR-02-WD-0001", "MSH-BR-02-WD-0002"],
    },
    {
      index: 11,
      name: "CAM-BR-02-FL",
      mode: "Bedroom 02 Floor",
      meshIds: ["MSH-BR-02-FL-0001", "MSH-BR-02-FL-0002", "MSH-BR-02-FL-0003"],
    },
  ],
  meshes: [
    "MSH-LV-TV-0001",
    "MSH-LV-TV-0002",
    "MSH-LV-TV-0003",
    "MSH-LV-TV-0004",
    "MSH-LV-CL-0001",
    "MSH-LV-CL-0002",
    "MSH-LV-CL-0003",
    "MSH-LV-FL-0001",
    "MSH-LV-FL-0002",
    "MSH-LV-FL-0003",
    "MSH-LV-FL-0004",
    "MSH-LV-sofa wall-0001",
    "MSH-LV-sofa wall-0002",
    "MSH-LV-sofa wall-0003",
    "MSH-LV-sofa wall-0004",
    "MSH-KT-CB-0001",
    "MSH-KT-IS-0001",
    "MSH-KT-PT-0001",
    "MSH-KT-PT-0002",
    "MSH-BR-01-TV-0001",
    "MSH-BR-01-TV-0002",
    "MSH-BR-01-TV-0003",
    "MSH-BR-01-TV-0004",
    "MSH-BR-01-HB-0001",
    "MSH-BR-01-HB-0002",
    "MSH-BR-01-HB-0003",
    "MSH-BR-01-HB-0004",
    "MSH-BR-01-WD-0001",
    "MSH-BR-01-WD-0002",
    "MSH-BR-01-FL-0001",
    "MSH-BR-01-FL-0002",
    "MSH-BR-01-FL-0003",
    "MSH-BR-02-TV-0001",
    "MSH-BR-02-TV-0002",
    "MSH-BR-02-TV-0003",
    "MSH-BR-02-TV-0004",
    "MSH-BR-02-HB-0001",
    "MSH-BR-02-HB-0002",
    "MSH-BR-02-HB-0003",
    "MSH-BR-02-HB-0004",
    "MSH-BR-02-WD-0001",
    "MSH-BR-02-WD-0002",
    "MSH-BR-02-FL-0001",
    "MSH-BR-02-FL-0002",
    "MSH-BR-02-FL-0003",
  ].map((id) => ({ id, displayName: id })),
};

export function getMeshesForCamera(
  camera: { index?: number; name?: string; mode?: string } | null | undefined,
  rules: MeshRulesConfig = DEFAULT_MESH_RULES,
): MeshOption[] {
  if (!camera) return [];

  const configCam = rules.cameras.find(
    (c) =>
      (c.index !== undefined &&
        c.index !== null &&
        Number(c.index) === Number(camera.index)) ||
      (c.name === camera.name &&
        (!c.mode || !camera.mode || c.mode === camera.mode)),
  );

  if (!configCam?.meshIds?.length) return [];
  return configCam.meshIds.map((id) => ({ id, displayName: id }));
}

/**
 * FUTURE: replace DEFAULT_MESH_RULES with a fetch:
 * export async function fetchMeshRules(unitId: string, level?: string) { ... }
 */
