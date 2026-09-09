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
  return [fn];
}

const SOFT_ACK = new Set(["ExitCamera", "MoveToZone", "SwitchCameraByName"]);
const PROCEED_ON_TIMEOUT = new Set([
  ...SOFT_ACK,
  "LoadLevel",
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
    if (PROCEED_ON_TIMEOUT.has(fn)) return true;
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
  opts?: { mockLog?: boolean },
): Promise<boolean> {
  const name = zoneName?.trim();
  if (!name) return false;
  return enqueueApply(async () => {
    if (opts?.mockLog) {
      console.info("[mock UE] MoveToZone", name);
      return true;
    }
    return sendAndWaitAck(
      send,
      { Function: "MoveToZone", ZoneName: name },
      { attempts: 10, gapMs: 280, label: `MoveToZone ${name}` },
    );
  });
}

export async function switchCameraByNameOnUe(
  send: SendFn,
  cameraName: string | null | undefined,
  opts?: { mockLog?: boolean },
): Promise<boolean> {
  const name = cameraName?.trim();
  if (!name) return false;
  return enqueueApply(async () => {
    if (opts?.mockLog) {
      console.info("[mock UE] SwitchCameraByName", name);
      return true;
    }
    return sendAndWaitAck(
      send,
      { Function: "SwitchCameraByName", CameraName: name },
      { attempts: 10, gapMs: 280, label: `SwitchCameraByName ${name}` },
    );
  });
}

export async function exitCameraOnUe(
  send: SendFn,
  opts?: { mockLog?: boolean },
): Promise<void> {
  await enqueueApply(async () => {
    if (opts?.mockLog) {
      console.info("[mock UE] ExitCamera");
      return;
    }
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
  opts?: { mockLog?: boolean },
): Promise<boolean> {
  if (!levelName) return false;
  if (opts?.mockLog) {
    console.info("[mock UE] LoadLevel", levelName);
    return true;
  }
  return sendAndWaitAck(
    send,
    { Function: "LoadLevel", LevelName: levelName },
    {
      attempts: 10,
      gapMs: 400,
      label: "LoadLevel",
      timeoutMs: 12000,
    },
  );
}

export async function saveCustomizationToUe(
  send: SendFn,
  design_code: string,
  opts?: { mockLog?: boolean },
): Promise<boolean> {
  const code = design_code.trim();
  if (!code) return false;
  if (opts?.mockLog) {
    console.info("[mock UE] SaveCustomization", code);
    return true;
  }
  const ok = await sendAndWaitAck(
    send,
    { Function: "SaveCustomization", design_code: code },
    { attempts: 8, gapMs: 250, label: "SaveCustomization", timeoutMs: 12000 },
  );
  if (ok) noteUeLoadId(code);
  return ok;
}

export async function loadCustomizationFromUe(
  send: SendFn,
  design_code: string,
  opts?: { mockLog?: boolean },
): Promise<boolean> {
  const code = design_code.trim();
  if (!code) return false;
  if (opts?.mockLog) {
    console.info("[mock UE] LoadCustomization", code);
    return true;
  }
  const ok = await sendAndWaitAck(
    send,
    { Function: "LoadCustomization", design_code: code },
    {
      attempts: 10,
      gapMs: 300,
      label: `LoadCustomization ${code}`,
      timeoutMs: 12000,
    },
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

export async function paintSelectionsToUe(
  send: SendFn,
  entries: SelectionEntry[],
  opts?: { mockLog?: boolean; materialsByMesh?: Record<string, string[]> },
): Promise<boolean> {
  const list = entries.filter((e) => e.meshId);
  if (!list.length) return true;
  return enqueueApply(async () => {
    let allOk = true;
    for (const entry of list) {
      const ok = await paintEntry(send, entry, {
        mockLog: opts?.mockLog,
        attempts: 8,
        applyMaterial: shouldApplyMaterialToMesh(
          entry.meshId,
          opts?.materialsByMesh,
        ),
      });
      if (!ok) allOk = false;
      await delay(120);
    }
    return allOk;
  });
}

export async function resetToDefaultOnUe(
  send: SendFn,
  opts?: { mockLog?: boolean },
): Promise<boolean> {
  return enqueueApply(async () => {
    if (opts?.mockLog) {
      console.info("[mock UE] ResetToDefault");
      return true;
    }
    return sendAndWaitAck(
      send,
      { Function: "ResetToDefault" },
      { attempts: 10, gapMs: 250, label: "ResetToDefault" },
    );
  });
}

async function paintEntry(
  send: SendFn,
  entry: SelectionEntry,
  opts?: { mockLog?: boolean; attempts?: number; applyMaterial?: boolean },
): Promise<boolean> {
  if (opts?.mockLog) {
    console.info("[mock UE] ChangeMesh/ApplyMaterial", entry, {
      applyMaterial: opts.applyMaterial,
    });
    return true;
  }
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
    mockLog?: boolean;
    design_code?: string | null;
    onSaveStatus?: (status: "saving" | "saved" | "failed") => void;
    skipSave?: boolean;
    applyMaterial?: boolean;
  },
): Promise<boolean> {
  return enqueueApply(async () => {
    opts?.onSaveStatus?.("saving");
    const ok = await paintEntry(send, entry, {
      mockLog: opts?.mockLog,
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
    const saved = await saveCustomizationToUe(send, code, {
      mockLog: opts?.mockLog,
    });
    opts?.onSaveStatus?.(saved ? "saved" : "failed");
    return saved;
  });
}

export async function restoreCameraZoneToUe(
  send: SendFn,
  opts: {
    zone?: string | null;
    camera?: string | null;
    mockLog?: boolean;
  },
): Promise<void> {
  const zone = opts.zone?.trim() || null;
  const camera = opts.camera?.trim() || null;
  if (camera) {
    await switchCameraByNameOnUe(send, camera, { mockLog: opts.mockLog });
    return;
  }
  if (zone) await moveToZoneOnUe(send, zone, { mockLog: opts.mockLog });
}

/** @deprecated ResetToDefault is the live reset path. */
export async function resetCustomizationOnUe(
  send: SendFn,
  opts?: { mockLog?: boolean },
): Promise<boolean> {
  return resetToDefaultOnUe(send, opts);
}
