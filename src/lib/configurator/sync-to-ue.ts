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

export type UeSyncResult = {
  ok: boolean;
  loadLevel: boolean;
  loadCustomization: boolean;
};

export const UE_SYNC_FAIL: UeSyncResult = {
  ok: false,
  loadLevel: false,
  loadCustomization: false,
};

export type SyncToUeArgs = {
  send: SendFn;
  isUeReady: () => boolean;
  layoutCode: string;
  designCode: string | null;
  returningVisit: boolean;
  zone?: string | null;
  camera?: string | null;
  skipLoadLevel?: boolean;
  skipViewRestore?: boolean;
  /** Fail the sync if LoadCustomization does not succeed. */
  requireLoadCustomization?: boolean;
  force?: boolean;
  mockLog?: boolean;
  onProgress?: (msg: string) => void;
};

let inflight: Promise<UeSyncResult> | null = null;
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

export function syncDraftToUe(args: SyncToUeArgs): Promise<UeSyncResult> {
  const key = syncKey(args);

  if (inflight) {
    const pending = inflight;
    return pending.then((result) => {
      const satisfied =
        result.loadLevel &&
        (!args.requireLoadCustomization || result.loadCustomization);
      if (satisfied) return result;
      return startSync(args, key);
    });
  }

  if (!args.force && lastCompletedKey === key) {
    return Promise.resolve({
      ok: true,
      loadLevel: true,
      loadCustomization: true,
    });
  }

  return startSync(args, key);
}

function startSync(args: SyncToUeArgs, key: string): Promise<UeSyncResult> {
  const runKey = args.force ? `${key}#force-${Date.now()}` : key;

  const run = async (): Promise<UeSyncResult> => {
    let loadLevel = Boolean(args.skipLoadLevel) || !args.layoutCode;
    let loadCustomization =
      !args.requireLoadCustomization && !args.returningVisit;

    if (!(await waitUntilReady(args.isUeReady, args.mockLog))) {
      console.warn("[UE sync] stream never ready");
      return { ...UE_SYNC_FAIL };
    }
    await delay(400);
    if (!args.mockLog && !(await waitUntilEmitAccepted(args.send))) {
      console.warn("[UE sync] emit never accepted");
      return { ...UE_SYNC_FAIL };
    }

    if (!args.skipLoadLevel && args.layoutCode) {
      args.onProgress?.("Opening your apartment…");
      loadLevel = await loadLevelOnUe(args.send, args.layoutCode, {
        mockLog: args.mockLog,
      });
      if (!loadLevel) {
        console.warn("[UE sync] LoadLevel emit was not accepted");
        return { ok: false, loadLevel: false, loadCustomization: false };
      }
      await waitUntilEmitAccepted(args.send);
    }

    const loadSaved =
      Boolean(args.designCode) &&
      (args.returningVisit || args.requireLoadCustomization);
    if (loadSaved) {
      const streamOk =
        args.mockLog ||
        ((await waitUntilReady(args.isUeReady, args.mockLog)) &&
          (await waitUntilEmitAccepted(args.send)));
      if (!streamOk) {
        console.warn("[UE sync] skip LoadCustomization — stream not ready");
        loadCustomization = false;
        if (args.requireLoadCustomization) {
          return { ok: false, loadLevel, loadCustomization: false };
        }
      } else {
        args.onProgress?.("Restoring your saved finishes…");
        loadCustomization = await loadCustomizationFromUe(
          args.send,
          args.designCode!,
          { mockLog: args.mockLog },
        );
        if (!loadCustomization) {
          console.warn(
            "[UE sync] LoadCustomization failed — leaving Unreal as source of truth",
          );
          if (args.requireLoadCustomization) {
            return { ok: false, loadLevel, loadCustomization: false };
          }
        }
      }
    } else if (args.requireLoadCustomization) {
      return { ok: false, loadLevel, loadCustomization: false };
    } else {
      loadCustomization = true;
    }

    if (!args.skipViewRestore) {
      args.onProgress?.("Setting your view…");
      await restoreCameraZoneToUe(args.send, {
        zone: args.zone,
        camera: args.camera,
        mockLog: args.mockLog,
      });
    }

    lastCompletedKey = key;
    return {
      ok: loadLevel && (loadCustomization || !args.requireLoadCustomization),
      loadLevel,
      loadCustomization,
    };
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
