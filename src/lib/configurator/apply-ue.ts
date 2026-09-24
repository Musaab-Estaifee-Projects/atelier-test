/**
 * Pixel Streaming commands. Live paths use the documented payloads only.
 */
import type { SelectionEntry } from "@/types/configurator";
import type { UeInteractionPayload } from "@/lib/stream-pixel/ue-protocol";
import { delay, sendUntilAccepted } from "@/lib/stream-pixel/share-restore";
import { noteUeLoadId, waitForUeAck } from "@/lib/configurator/ue-load-id";

type SendFn = (payload: UeInteractionPayload) => boolean;

let applyChain: Promise<unknown> = Promise.resolve();

function enqueueApply<T>(task: () => Promise<T>): Promise<T> {
  const next = applyChain.then(task, task);
  applyChain = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

function ackTypesFor(fn: string): string[] {
  if (fn === "LoadLevel") return ["OpeningLevel", "LoadLevel"];
  if (fn === "ChangeMeshByName") {
    return ["SelectMeshByName", "ChangeMeshByName", "ChangeMesh"];
  }
  if (fn === "ApplyMaterialToMesh") {
    return ["ApplyMaterialToMesh", "ApplyMaterial"];
  }
  if (fn === "SaveCustomization") {
    return ["SaveCustomization", "CustomizationSaved", "Saved"];
  }
  if (fn === "CaptureCamerasHighRes") {
    return ["CaptureCamerasHighRes", "CaptureCameras", "CamerasCaptured"];
  }
  return [fn];
}

const SOFT_ACK = new Set(["ExitCamera", "MoveToZone", "SwitchCameraByName"]);
const PROCEED_ON_TIMEOUT = new Set([
  ...SOFT_ACK,
  "LoadLevel",
  "LoadCustomization",
  "CaptureCamerasHighRes",
  "ChangeMeshByName",
  "ApplyMaterialToMesh",
]);

async function sendAndWaitAck(
  send: SendFn,
  payload: UeInteractionPayload,
  opts?: {
    attempts?: number;
    gapMs?: number;
    label?: string;
    timeoutMs?: number;
    requireAck?: boolean;
  },
): Promise<boolean> {
  const fn = String((payload as { Function?: string }).Function ?? "");
  const types = ackTypesFor(fn);
  const attempts = opts?.attempts ?? 10;
  const gapMs = opts?.gapMs ?? 280;
  const timeoutMs =
    opts?.timeoutMs ??
    (SOFT_ACK.has(fn)
      ? Math.max(900, attempts * gapMs)
      : attempts * gapMs + 2500);
  const pending = waitForUeAck(types, timeoutMs);
  const accepted = await sendUntilAccepted(send, payload, {
    attempts,
    gapMs,
    label: opts?.label,
  });
  if (!accepted) return false;
  const ack = await pending;
  if (ack === "timeout") {
    if (!opts?.requireAck && PROCEED_ON_TIMEOUT.has(fn)) return true;
    console.warn("[UE] ack timeout", fn, types);
    return false;
  }
  if (!ack.ok) {
    console.warn("[UE] ack failed", fn, ack);
    return false;
  }
  return true;
}

export async function moveToZoneOnUe(
  send: SendFn,
  zoneName: string | null | undefined,
): Promise<boolean> {
  const name = zoneName?.trim();
  if (!name) return false;
  return enqueueApply(() =>
    sendAndWaitAck(
      send,
      { Function: "MoveToZone", ZoneName: name },
      { attempts: 10, gapMs: 280, label: `MoveToZone ${name}` },
    ),
  );
}

export async function switchCameraByNameOnUe(
  send: SendFn,
  cameraName: string | null | undefined,
): Promise<boolean> {
  const name = cameraName?.trim();
  if (!name) return false;
  return enqueueApply(() =>
    sendAndWaitAck(
      send,
      { Function: "SwitchCameraByName", CameraName: name },
      { attempts: 10, gapMs: 280, label: `SwitchCameraByName ${name}` },
    ),
  );
}

export async function exitCameraOnUe(send: SendFn): Promise<void> {
  await enqueueApply(async () => {
    await sendAndWaitAck(
      send,
      { Function: "ExitCamera" },
      { attempts: 6, gapMs: 200, label: "ExitCamera" },
    );
  });
}

export async function loadLevelOnUe(
  send: SendFn,
  levelName: string,
  opts?: { requireAck?: boolean },
): Promise<boolean> {
  if (!levelName) return false;
  return enqueueApply(() =>
    sendAndWaitAck(
      send,
      { Function: "LoadLevel", LevelName: levelName },
      {
        attempts: 10,
        gapMs: 400,
        label: "LoadLevel",
        timeoutMs: 16000,
        requireAck: opts?.requireAck,
      },
    ),
  );
}

export async function saveCustomizationToUe(
  send: SendFn,
  design_code: string,
): Promise<boolean> {
  const code = design_code.trim();
  if (!code) return false;
  const ok = await sendAndWaitAck(
    send,
    { Function: "SaveCustomization", design_code: code },
    { attempts: 8, gapMs: 250, label: "SaveCustomization", timeoutMs: 12000 },
  );
  if (ok) noteUeLoadId(code);
  return ok;
}

const KEEP_SAVE_ACK_MS = 25_000;
const KEEP_SAVE_RETRY_GAP_MS = 800;
const KEEP_STREAM_READY_MS = 60_000;
const KEEP_STREAM_EMIT_MS = 30_000;
const KEEP_LOAD_LEVEL_ACK_MS = 90_000;
const KEEP_LOAD_CUSTOMIZATION_ACK_MS = 60_000;

async function waitUntilUeReady(
  isUeReady: () => boolean,
  timeoutMs: number,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (isUeReady()) return true;
    await delay(200);
  }
  return isUeReady();
}

async function waitUntilKeepEmitAccepted(
  send: SendFn,
  timeoutMs: number,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (send({ Function: "ConfiguratorReadyProbe" })) return true;
    await delay(250);
  }
  return send({ Function: "ConfiguratorReadyProbe" });
}

/** Keep-customization only: do not SaveCustomization until the live stream can accept it. */
async function waitForKeepUeStream(args: {
  send: SendFn;
  isUeReady: () => boolean;
  onWaiting?: () => void;
}): Promise<boolean> {
  const readyNow =
    args.isUeReady() && args.send({ Function: "ConfiguratorReadyProbe" });
  if (!readyNow) args.onWaiting?.();
  if (!(await waitUntilUeReady(args.isUeReady, KEEP_STREAM_READY_MS))) {
    return false;
  }
  return waitUntilKeepEmitAccepted(args.send, KEEP_STREAM_EMIT_MS);
}

export type KeepSourceRestoreResult = {
  streamReady: boolean;
  loadLevel: boolean;
  loadCustomization: boolean;
};

/**
 * Keep-customization only: stream ready → LoadLevel → wait for stream again →
 * LoadCustomization(source). LoadLevel on a slow connection can take a minute;
 * we do not fail the keep flow on a lost ack if the stream recovers.
 */
export async function restoreKeepSourceOnUe(args: {
  send: SendFn;
  isUeReady: () => boolean;
  layoutCode: string;
  sourceDesignCode: string;
  onWaiting?: () => void;
  onStreamReady?: () => void;
}): Promise<KeepSourceRestoreResult> {
  const layout = args.layoutCode.trim();
  const source = args.sourceDesignCode.trim();
  if (!layout || !source) {
    return { streamReady: false, loadLevel: false, loadCustomization: false };
  }

  const waitStream = () =>
    waitForKeepUeStream({
      send: args.send,
      isUeReady: args.isUeReady,
      onWaiting: args.onWaiting,
    });

  if (!(await waitStream())) {
    args.onStreamReady?.();
    return { streamReady: false, loadLevel: false, loadCustomization: false };
  }

  const sendLoadLevel = () =>
    enqueueApply(() =>
      sendAndWaitAck(
        args.send,
        { Function: "LoadLevel", LevelName: layout },
        {
          attempts: 30,
          gapMs: 500,
          label: "LoadLevel keep",
          timeoutMs: KEEP_LOAD_LEVEL_ACK_MS,
          requireAck: true,
        },
      ),
    );

  let loadLevel = await sendLoadLevel();
  args.onWaiting?.();
  const readyAfterLevel = await waitStream();
  if (!loadLevel && readyAfterLevel) {
    console.warn(
      "[UE] Keep LoadLevel ack timed out — stream recovered, retrying LoadLevel once",
    );
    loadLevel = await sendLoadLevel();
    args.onWaiting?.();
    if (!(await waitStream())) {
      args.onStreamReady?.();
      return { streamReady: false, loadLevel, loadCustomization: false };
    }
    if (!loadLevel) {
      console.warn(
        "[UE] Keep LoadLevel ack still missing — continuing because the stream accepts commands",
      );
      loadLevel = true;
    }
  } else if (!loadLevel || !readyAfterLevel) {
    args.onStreamReady?.();
    return {
      streamReady: readyAfterLevel,
      loadLevel,
      loadCustomization: false,
    };
  }

  const sendLoadCustomization = () =>
    loadCustomizationFromUe(args.send, source, {
      requireAck: true,
      timeoutMs: KEEP_LOAD_CUSTOMIZATION_ACK_MS,
    });

  let loadCustomization = await sendLoadCustomization();
  if (!loadCustomization) {
    console.warn(
      "[UE] Keep LoadCustomization first attempt failed — waiting for stream and retrying once",
    );
    args.onWaiting?.();
    if (!(await waitStream())) {
      args.onStreamReady?.();
      return { streamReady: false, loadLevel: true, loadCustomization: false };
    }
    loadCustomization = await sendLoadCustomization();
  }

  args.onStreamReady?.();
  return {
    streamReady: true,
    loadLevel: true,
    loadCustomization,
  };
}

/**
 * Keep-customization only: wait for the first SaveCustomization ack, then
 * send once more. Other save paths keep the default timeout and no retry.
 */
export async function saveKeepCustomizationToUe(
  send: SendFn,
  design_code: string,
  opts?: {
    isUeReady?: () => boolean;
    onWaiting?: () => void;
  },
): Promise<boolean> {
  const code = design_code.trim();
  if (!code) return false;
  if (opts?.isUeReady) {
    const ready = await waitForKeepUeStream({
      send,
      isUeReady: opts.isUeReady,
      onWaiting: opts.onWaiting,
    });
    if (!ready) return false;
  }
  return enqueueApply(async () => {
    const attempt = (label: string) =>
      sendAndWaitAck(
        send,
        { Function: "SaveCustomization", design_code: code },
        {
          attempts: 16,
          gapMs: 400,
          label,
          timeoutMs: KEEP_SAVE_ACK_MS,
        },
      );
    if (await attempt("SaveCustomization keep")) {
      noteUeLoadId(code);
      return true;
    }
    console.warn(
      "[UE] Keep SaveCustomization first attempt failed or timed out — retrying once",
    );
    await delay(KEEP_SAVE_RETRY_GAP_MS);
    const retried = await attempt("SaveCustomization keep retry");
    if (retried) noteUeLoadId(code);
    return retried;
  });
}

export async function loadCustomizationFromUe(
  send: SendFn,
  design_code: string,
  opts?: { requireAck?: boolean; timeoutMs?: number },
): Promise<boolean> {
  const code = design_code.trim();
  if (!code) return false;
  const timeoutMs = opts?.timeoutMs ?? 20000;
  const keep = timeoutMs > 20000;
  const ok = await enqueueApply(() =>
    sendAndWaitAck(
      send,
      { Function: "LoadCustomization", design_code: code },
      {
        attempts: keep ? 24 : 12,
        gapMs: keep ? 400 : 300,
        label: `LoadCustomization ${code}`,
        timeoutMs,
        requireAck: opts?.requireAck,
      },
    ),
  );
  if (ok) await delay(400);
  else console.warn("[UE] LoadCustomization failed or missing");
  return ok;
}

export function shouldApplyMaterialToMesh(
  meshId: string,
  materialsByMesh?: Record<string, string[]>,
): boolean {
  return (materialsByMesh?.[meshId]?.length ?? 0) > 1;
}

export async function resetToDefaultOnUe(send: SendFn): Promise<boolean> {
  return enqueueApply(() =>
    sendAndWaitAck(
      send,
      { Function: "ResetToDefault" },
      { attempts: 10, gapMs: 250, label: "ResetToDefault" },
    ),
  );
}

async function paintEntry(
  send: SendFn,
  entry: SelectionEntry,
  opts?: { attempts?: number; applyMaterial?: boolean },
): Promise<boolean> {
  const attempts = opts?.attempts ?? 12;
  const meshOk = await sendAndWaitAck(
    send,
    { Function: "ChangeMeshByName", MeshName: entry.meshId },
    { attempts, gapMs: 250, label: `ChangeMesh ${entry.meshId}` },
  );
  if (!meshOk) return false;
  if (!opts?.applyMaterial || !entry.materialId) return true;
  await delay(180);
  return sendAndWaitAck(
    send,
    {
      Function: "ApplyMaterialToMesh",
      MeshName: entry.meshId,
      MaterialName: entry.materialId,
    },
    { attempts, gapMs: 250, label: `ApplyMaterial ${entry.materialId}` },
  );
}

export async function applyOneSelectionToUe(
  send: SendFn,
  entry: SelectionEntry,
  opts?: {
    design_code?: string | null;
    onSaveStatus?: (status: "saving" | "saved" | "failed") => void;
    skipSave?: boolean;
    applyMaterial?: boolean;
  },
): Promise<boolean> {
  return enqueueApply(async () => {
    opts?.onSaveStatus?.("saving");
    const ok = await paintEntry(send, entry, {
      applyMaterial: Boolean(opts?.applyMaterial),
    });
    if (!ok) {
      opts?.onSaveStatus?.("failed");
      return false;
    }
    if (opts?.skipSave) {
      opts?.onSaveStatus?.("saved");
      return true;
    }
    const code = opts?.design_code?.trim();
    if (!code) {
      console.warn("[UE] SaveCustomization skipped — missing design_code");
      opts?.onSaveStatus?.("failed");
      return false;
    }
    const saved = await saveCustomizationToUe(send, code);
    opts?.onSaveStatus?.(saved ? "saved" : "failed");
    return saved;
  });
}

export async function restoreCameraZoneToUe(
  send: SendFn,
  opts: {
    zone?: string | null;
    camera?: string | null;
  },
): Promise<void> {
  const zone = opts.zone?.trim() || null;
  const camera = opts.camera?.trim() || null;
  if (camera) {
    await switchCameraByNameOnUe(send, camera);
    return;
  }
  if (zone) await moveToZoneOnUe(send, zone);
}

export async function captureCamerasHighResOnUe(
  send: SendFn,
  design_code: string,
): Promise<boolean> {
  const code = design_code.trim();
  if (!code) return false;
  return enqueueApply(() =>
    sendAndWaitAck(
      send,
      { Function: "CaptureCamerasHighRes", design_code: code },
      {
        attempts: 8,
        gapMs: 300,
        label: "CaptureCamerasHighRes",
        timeoutMs: 20000,
      },
    ),
  );
}

export function captureCamerasOnUe(
  send: SendFn,
  design_code: string,
  cameraNames: string[],
): boolean {
  const code = design_code.trim();
  if (!code || !cameraNames.length) return false;
  return send({
    Function: "CaptureCameras",
    design_code: code,
    CameraNames: cameraNames,
  });
}
