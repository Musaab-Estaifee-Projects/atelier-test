import type { ConfiguratorSession, RoomRenderCard } from "@/types/configurator";
import type { GetRendersData, RenderZoneCamera } from "@/services/renders.service";
import { listRenderCameras } from "@/services/renders.service";

function stillStatus(
  cam: Pick<RenderZoneCamera, "status" | "render_s3_url" | "is_failed">,
): RoomRenderCard["status"] {
  if (cam.status === "completed" && cam.render_s3_url) return "completed";
  if (cam.is_failed || cam.status === "failed") return "error";
  if (cam.status === "queued" || cam.status === "pending") return "queued";
  return "rendering";
}

export function mapRendersToRooms(
  session: ConfiguratorSession,
  data: GetRendersData | null,
): RoomRenderCard[] {
  if (data?.camera_zones.length) {
    return data.camera_zones.map((zone) => {
      const apiCams = zone.cameras ?? [];
      const stills = apiCams.map((cam) => ({
        cameraName: cam.camera_id,
        imageUrl: cam.render_s3_url || undefined,
        file: cam.status,
      }));
      const statuses = apiCams.map(stillStatus);
      const allDone =
        stills.length > 0 && stills.every((s) => Boolean(s.imageUrl));
      const anyError = statuses.includes("error");
      const anyRendering = statuses.includes("rendering");
      const hero = stills.find((s) => s.imageUrl) ?? stills[0];
      const sessionZone = session.zones.find((z) => z.id === zone.camera_zone_id);

      return {
        zoneId: zone.camera_zone_id,
        label: zone.camera_zone_name?.trim() || sessionZone?.label || zone.camera_zone_id,
        ueZone: sessionZone?.ueZone || zone.camera_zone_id,
        heroCameraName: hero?.cameraName ?? zone.camera_zone_id,
        heroCameraIndex: 0,
        status: allDone
          ? "completed"
          : anyError && !anyRendering
            ? "error"
            : anyRendering || stills.some((s) => !s.imageUrl)
              ? "rendering"
              : "queued",
        imageUrl: hero?.imageUrl,
        attempt: Math.max(0, ...apiCams.map((c) => c.attempt_number || 1), 1),
        stills,
      };
    });
  }

  return session.zones.map((zone) => ({
    zoneId: zone.id,
    label: zone.label,
    ueZone: zone.ueZone,
    heroCameraName: zone.cameras[0]?.name ?? zone.id,
    heroCameraIndex: 0,
    status: "queued",
    imageUrl: undefined,
    attempt: 0,
    stills: zone.cameras.map((cam) => ({
      cameraName: cam.name,
      imageUrl: undefined as string | undefined,
    })),
  }));
}

export function failedRenderCameras(data: GetRendersData | null) {
  return listRenderCameras(data).filter(
    (cam) => cam.is_failed || cam.status === "failed",
  );
}

export function rendersBusy(data: GetRendersData | null): boolean {
  if (!data) return true;
  if (data.is_all_rendered) return false;
  return listRenderCameras(data).some(
    (cam) =>
      cam.status !== "completed" ||
      !cam.render_s3_url ||
      cam.is_failed,
  );
}
