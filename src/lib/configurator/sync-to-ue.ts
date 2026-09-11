/**
 * Boot Unreal: LoadLevel, optional LoadCustomization, restore URL view.
 * LoadCustomization miss/timeout leaves the live scene as UE last left it.
 */
import type { UeInteractionPayload } from "@/lib/stream-pixel/ue-protocol";
import {
  loadCustomizationFromUe,
  loadLevelOnUe,
  restoreCameraZoneToUe,
} from "@/lib/configurator/apply-ue";
import { delay } from "@/lib/stream-pixel/share-restore";

type SendFn = (payload: UeInteractionPayload) => boolean;

export type SyncToUeArgs = {
  send: SendFn;
  isUeReady: () => boolean;
  layoutCode: string;
  designCode: string | null;
  returningVisit: boolean;
  zone?: string | null;
  camera?: string | null;
  skipLoadLevel?: boolean;
  force?: boolean;
  mockLog?: boolean;
  onProgress?: (msg: string) => void;
};

let inflight: Promise<boolean> | null = null;
let inflightKey = "";
let lastCompletedKey = "";

function syncKey(args: SyncToUeArgs): string {
  return [
    args.layoutCode,
    args.designCode ?? "",
    args.returningVisit ? "1" : "0",
    args.zone ?? "",
    args.camera ?? "",
  ].join("|");
}

async function waitUntilReady(
  isUeReady: () => boolean,
  mockLog: boolean | undefined,
): Promise<boolean> {
  if (mockLog) return true;
  for (let i = 0; i < 120; i++) {
    if (isUeReady()) return true;
    await delay(200);
  }
  return isUeReady();
}

async function waitUntilEmitAccepted(send: SendFn): Promise<boolean> {
  for (let i = 0; i < 60; i++) {
    if (send({ Function: "ConfiguratorReadyProbe" })) return true;
    await delay(250);
  }
  return false;
}

export function syncDraftToUe(args: SyncToUeArgs): Promise<boolean> {
  const key = syncKey(args);
  if (!args.force && inflight && inflightKey === key) return inflight;

  const previous = inflight;
  const runKey = args.force ? `${key}#force-${Date.now()}` : key;

  const run = async (): Promise<boolean> => {
    if (previous) await previous.catch(() => false);

    if (!(await waitUntilReady(args.isUeReady, args.mockLog))) {
      console.warn("[UE sync] stream never ready");
      return false;
    }
    await delay(400);
    if (!args.mockLog && !(await waitUntilEmitAccepted(args.send))) {
      console.warn("[UE sync] emit never accepted");
      return false;
    }

    if (!args.skipLoadLevel && args.layoutCode) {
      args.onProgress?.("Opening your apartment…");
      const levelOk = await loadLevelOnUe(args.send, args.layoutCode, {
        mockLog: args.mockLog,
      });
      if (!levelOk) {
        console.warn("[UE sync] LoadLevel emit was not accepted");
        return false;
      }
      await waitUntilEmitAccepted(args.send);
    }

    const loadSaved = args.returningVisit && Boolean(args.designCode);
    if (loadSaved) {
      const streamOk =
        args.mockLog ||
        ((await waitUntilReady(args.isUeReady, args.mockLog)) &&
          (await waitUntilEmitAccepted(args.send)));
      if (!streamOk) {
        console.warn("[UE sync] skip LoadCustomization — stream not ready");
      } else {
        args.onProgress?.("Restoring your saved finishes…");
        const loaded = await loadCustomizationFromUe(
          args.send,
          args.designCode!,
          { mockLog: args.mockLog },
        );
        if (!loaded) {
          console.warn(
            "[UE sync] LoadCustomization failed — leaving Unreal as source of truth",
          );
        }
      }
    }

    args.onProgress?.("Setting your view…");
    await restoreCameraZoneToUe(args.send, {
      zone: args.zone,
      camera: args.camera,
      mockLog: args.mockLog,
    });

    lastCompletedKey = key;
    return true;
  };

  inflightKey = runKey;
  const promise = run().finally(() => {
    if (inflightKey === runKey) {
      inflight = null;
      inflightKey = "";
    }
  });
  inflight = promise;
  return promise;
}

export function getLastUeSyncKey(): string {
  return lastCompletedKey;
}

export function invalidateUeSyncCache(): void {
  lastCompletedKey = "";
}
