import type { ConfiguratorSession, RoomRenderCard } from "@/types/configurator";
import type { GetRendersData, RenderCameraStatus } from "@/services/renders.service";

function stillStatus(
  cam: RenderCameraStatus,
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
  const byZone = new Map<string, RenderCameraStatus[]>();
  for (const cam of data?.cameras ?? []) {
    const list = byZone.get(cam.camera_zone_id) ?? [];
    list.push(cam);
    byZone.set(cam.camera_zone_id, list);
  }

  return session.zones.map((zone) => {
    const apiCams = byZone.get(zone.id);
    const stills =
      apiCams && apiCams.length
        ? apiCams.map((cam) => ({
            cameraName: cam.camera_id,
            imageUrl: cam.render_s3_url || undefined,
            file: cam.status,
          }))
        : zone.cameras.map((cam) => ({
            cameraName: cam.name,
            imageUrl: undefined as string | undefined,
          }));

    const statuses = (apiCams ?? []).map(stillStatus);
    const allDone =
      stills.length > 0 && stills.every((s) => Boolean(s.imageUrl));
    const anyError = statuses.includes("error");
    const anyRendering = statuses.includes("rendering");
    const hero = stills.find((s) => s.imageUrl) ?? stills[0];

    return {
      zoneId: zone.id,
      label: zone.label,
      ueZone: zone.ueZone,
      heroCameraName: hero?.cameraName ?? zone.cameras[0]?.name ?? zone.id,
      heroCameraIndex: 0,
      status: allDone
        ? "completed"
        : anyError && !anyRendering
          ? "error"
          : anyRendering || stills.some((s) => !s.imageUrl)
            ? "rendering"
            : "queued",
      imageUrl: hero?.imageUrl,
      attempt: 0,
      stills,
    };
  });
}

export function failedRenderCameras(data: GetRendersData | null) {
  return (data?.cameras ?? []).filter(
    (cam) => cam.is_failed || cam.status === "failed",
  );
}

export function rendersBusy(data: GetRendersData | null): boolean {
  if (!data) return true;
  return (data.cameras ?? []).some(
    (cam) =>
      cam.status !== "completed" ||
      !cam.render_s3_url ||
      cam.is_failed,
  );
}
