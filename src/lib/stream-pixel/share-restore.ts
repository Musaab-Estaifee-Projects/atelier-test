import type { UeInteractionPayload } from "@/lib/stream-pixel/ue-protocol";

type SendFn = (payload: UeInteractionPayload) => boolean;

const completedKeys = new Set<string>();
const inflight = new Map<string, Promise<void>>();

export function shareRestoreKey(parts: {
  projectId: string;
  level?: string | null;
  zone?: string | null;
  camera?: number | null;
  mesh?: string | null;
  material?: string | null;
  designCode?: string | null;
}): string {
  return [
    parts.projectId,
    parts.level ?? "",
    parts.zone ?? "",
    parts.camera ?? "",
    parts.mesh ?? "",
    parts.material ?? "",
    parts.designCode ?? "",
  ].join("|");
}

/**
 * Run a share restore once per key for this page session.
 * Survives React Strict Mode double-effects (same promise is reused).
 */
export function runShareRestoreOnce(
  key: string,
  task: () => Promise<void>,
): Promise<void> {
  if (completedKeys.has(key)) return Promise.resolve();
  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = task()
    .then(() => {
      completedKeys.add(key);
    })
    .catch((err) => {
      console.error("[ShareRestore] failed", err);
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}

export function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/** Retry until emitUIInteraction actually accepts the message. */
export async function sendUntilAccepted(
  send: SendFn,
  payload: UeInteractionPayload,
  opts?: { attempts?: number; gapMs?: number; label?: string },
): Promise<boolean> {
  const attempts = opts?.attempts ?? 8;
  const gapMs = opts?.gapMs ?? 400;
  for (let i = 0; i < attempts; i++) {
    if (send(payload)) {
      if (opts?.label) {
        console.info(`[ShareRestore] sent ${opts.label} (attempt ${i + 1})`);
      }
      return true;
    }
    await delay(gapMs);
  }
  console.warn("[ShareRestore] give up sending", payload);
  return false;
}

/**
 * Ask UE to place the pawn in the shared zone before switching cameras.
 * Tries common Blueprint names — harmless no-ops if unsupported.
 */
export async function probeEnterZone(
  send: SendFn,
  zoneName: string,
): Promise<void> {
  const probes: UeInteractionPayload[] = [
    { Function: "MoveToZone", ZoneName: zoneName },
    { Function: "EnterZone", ZoneName: zoneName },
    { Function: "GoToZone", ZoneName: zoneName },
    { Function: "TeleportToZone", ZoneName: zoneName },
    { Function: "EnterCameraZone", ZoneName: zoneName },
    { Function: "EnterZone", Zone: zoneName },
    { Function: "TeleportToArea", AreaName: zoneName },
  ];

  for (const payload of probes) {
    send(payload);
    await delay(150);
  }
}
