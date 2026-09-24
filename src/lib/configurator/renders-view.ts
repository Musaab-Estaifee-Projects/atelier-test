import type { LightboxStill } from "@/components/configurator/final-design/final-design-viewer";
import {
  listRenderCameras,
  type GetRendersData,
} from "@/services/renders.service";
import type { ConfiguratorSession, RoomRenderCard } from "@/types/configurator";

export function failedRenderCameras(data: GetRendersData | null) {
  return listRenderCameras(data).filter(
    (cam) => cam.is_failed || cam.status === "failed",
  );
}

export function rendersInProgress(data: GetRendersData | null): boolean {
  if (!data) return true;
  if (data.is_all_rendered || data.is_terminal) return false;
  return listRenderCameras(data).some(
    (cam) =>
      !cam.is_failed && cam.status !== "completed" && cam.status !== "failed",
  );
}

/**
 * Room cards for the renders screen. Without render data, a catalog session
 * yields placeholder rooms; without a session the list is empty (skeleton).
 */
export function roomsFromRenders(
  data: GetRendersData | null,
  session?: ConfiguratorSession | null,
): RoomRenderCard[] {
  if (!data?.camera_zones.length) {
    return (session?.zones ?? []).map((zone) => ({
      zoneId: zone.id,
      label: zone.label,
      ueZone: zone.ueZone || zone.id,
      heroCameraName: zone.cameras[0]?.name ?? zone.id,
      heroCameraIndex: 0,
      status: "rendering" as const,
      imageUrl: undefined,
      attempt: 1,
      stills: (zone.cameras.length
        ? zone.cameras
        : [{ name: zone.id, mode: "" }]
      ).map((cam) => ({
        cameraName: cam.name,
        imageUrl: undefined,
      })),
    }));
  }

  return data.camera_zones.map((zone) => {
    const cams = zone.cameras ?? [];
    const stills = cams.map((cam) => ({
      cameraName: cam.camera_id,
      imageUrl: cam.render_s3_url ?? undefined,
    }));
    const allDone =
      cams.length > 0 &&
      cams.every((c) => c.status === "completed" && c.render_s3_url);
    const anyFailed = cams.some((c) => c.is_failed || c.status === "failed");
    const hero = cams.find((c) => c.render_s3_url) ?? cams[0];
    const sessionZone = session?.zones.find(
      (z) => z.id === zone.camera_zone_id,
    );
    return {
      zoneId: zone.camera_zone_id,
      label:
        zone.camera_zone_name?.trim() ||
        sessionZone?.label ||
        zone.camera_zone_id,
      ueZone: sessionZone?.ueZone || zone.camera_zone_id,
      heroCameraName: hero?.camera_id ?? zone.camera_zone_id,
      heroCameraIndex: 0,
      status: allDone ? "completed" : anyFailed ? "error" : "rendering",
      imageUrl: hero?.render_s3_url ?? undefined,
      attempt: Math.max(0, ...cams.map((c) => c.attempt_number || 1), 1),
      stills,
    };
  });
}

export function stillsFromRenders(
  data: GetRendersData | null,
  session?: ConfiguratorSession | null,
): LightboxStill[] {
  return (data?.camera_zones ?? []).flatMap((zone) =>
    zone.cameras
      .filter((c) => c.render_s3_url)
      .map((c) => {
        const zoneName =
          zone.camera_zone_name?.trim() ||
          session?.zones.find((z) => z.id === zone.camera_zone_id)?.label ||
          zone.camera_zone_id;
        const cameraLabel =
          c.camera_name?.trim() ||
          session?.slotLabels[c.camera_id] ||
          c.camera_id;
        return {
          cameraName: c.camera_id,
          cameraLabel,
          zoneId: zone.camera_zone_id,
          zoneName,
          label: `${zoneName} - ${cameraLabel}`,
          imageUrl: c.render_s3_url as string,
        };
      }),
  );
}

export function stillIndexFor(
  stills: LightboxStill[],
  zoneId: string,
  cameraName?: string,
): number {
  return stills.findIndex(
    (s) => s.zoneId === zoneId && (!cameraName || s.cameraName === cameraName),
  );
}
