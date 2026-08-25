import type {
  CameraRule,
  ConfiguratorCamera,
  SelectionEntry,
} from "@/types/configurator";
import { slotFromCamera } from "@/mocks/configurator/session";

/**
 * Resolve the UE camera index needed before SetMesh/ApplyMaterial.
 * Atelier Blueprints apply finishes in the active camera context — without
 * switching, only the last (or currently viewed) slot sticks on reload.
 */
export function resolveCameraIndexForSelection(
  entry: SelectionEntry,
  opts: {
    liveCameras?: ConfiguratorCamera[];
    sessionCameras?: CameraRule[];
  },
): number | null {
  if (
    typeof entry.cameraIndex === "number" &&
    !Number.isNaN(entry.cameraIndex)
  ) {
    return entry.cameraIndex;
  }

  const live = opts.liveCameras ?? [];
  const session = opts.sessionCameras ?? [];

  const fromLiveId = live.find(
    (c) =>
      c.name === entry.cameraId ||
      c.id === entry.cameraId ||
      (entry.cameraId != null &&
        c.name?.toLowerCase() === entry.cameraId.toLowerCase()),
  );
  if (fromLiveId?.index != null && !Number.isNaN(Number(fromLiveId.index))) {
    return Number(fromLiveId.index);
  }

  const fromLiveSlot = live.find((c) => {
    const slot = slotFromCamera(c.name, c.mode);
    return slot === entry.slot;
  });
  if (
    fromLiveSlot?.index != null &&
    !Number.isNaN(Number(fromLiveSlot.index))
  ) {
    return Number(fromLiveSlot.index);
  }

  const fromSessionId = session.find(
    (c) => c.name === entry.cameraId || c.slot === entry.slot,
  );
  if (
    fromSessionId?.index != null &&
    !Number.isNaN(Number(fromSessionId.index))
  ) {
    return Number(fromSessionId.index);
  }

  const fromMesh = session.find((c) => c.meshIds?.includes(entry.meshId));
  if (fromMesh?.index != null && !Number.isNaN(Number(fromMesh.index))) {
    return Number(fromMesh.index);
  }

  return null;
}
