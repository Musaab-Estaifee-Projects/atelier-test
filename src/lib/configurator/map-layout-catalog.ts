import type {
  CameraRule,
  ConfiguratorSession,
  MaterialOption,
  MeshArea,
  MeshOption,
  SelectionEntry,
  ZoneDefinition,
} from "@/types/configurator";
import type { LayoutCatalogData } from "@/types/layout-catalog";
import { setActiveCatalogZones } from "@/lib/configurator/zone-catalog";

export function mapLayoutCatalogToSession(args: {
  catalog: LayoutCatalogData;
  streamProjectId: string;
  backendProjectId: string;
  unitId?: string | null;
}): ConfiguratorSession {
  const cameras: CameraRule[] = [];
  const meshes: MeshOption[] = [];
  const materials: MaterialOption[] = [];
  const materialsByMesh: Record<string, string[]> = {};
  const meshAreas: MeshArea[] = [];
  const slotLabels: Record<string, string> = {};
  const defaults: SelectionEntry[] = [];
  const seenMaterials = new Set<string>();
  const seenMeshes = new Set<string>();

  const zones: ZoneDefinition[] = args.catalog.camera_zones.map((zone) => {
    const zoneId = zone.ue_id;
    return {
      id: zoneId,
      label: zone.name,
      ueZone: zone.ue_id,
      cameras: zone.cameras.map((cam) => {
        const slot = cam.ue_id;
        slotLabels[slot] = cam.name;
        cameras.push({
          name: cam.ue_id,
          mode: cam.name,
          slot,
          zoneId,
          meshIds: cam.meshes.map((m) => m.ue_id),
        });

        const defaultMesh =
          cam.meshes.find((m) => m.is_default) ?? cam.meshes[0];
        if (defaultMesh) {
          const defaultMat =
            defaultMesh.materials.find((m) => m.is_default) ??
            defaultMesh.materials[0];
          defaults.push({
            slot,
            meshId: defaultMesh.ue_id,
            materialId: defaultMat?.ue_id ?? "",
            cameraId: cam.ue_id,
          });
        }

        for (const mesh of cam.meshes) {
          if (!seenMeshes.has(mesh.ue_id)) {
            seenMeshes.add(mesh.ue_id);
            meshes.push({
              id: mesh.ue_id,
              displayName: mesh.name,
              slot,
              thumbnailUrl: mesh.image ?? undefined,
              pricePerSqm: mesh.price ?? undefined,
              isDefault: mesh.is_default,
            });
          }
          if (mesh.dimension != null && Number.isFinite(mesh.dimension)) {
            meshAreas.push({ meshId: mesh.ue_id, areaSqm: mesh.dimension });
          }
          materialsByMesh[mesh.ue_id] = mesh.materials.map((m) => m.ue_id);
          for (const mat of mesh.materials) {
            if (seenMaterials.has(mat.ue_id)) continue;
            seenMaterials.add(mat.ue_id);
            materials.push({
              id: mat.ue_id,
              displayName: mat.name,
              pricePerSqm: mat.price ?? 0,
            });
          }
        }

        return { name: cam.ue_id, mode: cam.name };
      }),
    };
  });

  setActiveCatalogZones(zones);

  return {
    streamProjectId: args.streamProjectId,
    unitId: args.unitId?.trim() || "",
    levelName: args.catalog.code,
    layoutCode: args.catalog.code,
    backendProjectId: args.backendProjectId,
    cameras,
    meshes,
    materials,
    materialsByMesh,
    meshAreas,
    slotLabels,
    zones,
    defaults,
  };
}
