/**
 * Boot Unreal: LoadLevel, optional LoadCustomization, restore URL view.
 * If LoadCustomization 404s, paint stored finishes that differ from defaults.
 */
import type { UeInteractionPayload } from "@/lib/stream-pixel/ue-protocol";
import type { SelectionEntry } from "@/types/configurator";
import {
  loadCustomizationFromUe,
  loadLevelOnUe,
  paintSelectionsToUe,
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
  selections?: SelectionEntry[];
  defaults?: SelectionEntry[];
  zone?: string | null;
  camera?: string | null;
  skipLoadLevel?: boolean;
  force?: boolean;
  mockLog?: boolean;
  onProgress?: (msg: string) => void;
};

function entriesToPaint(
  selections: SelectionEntry[] | undefined,
  defaults: SelectionEntry[] | undefined,
): SelectionEntry[] {
  const list = selections?.filter((e) => e.meshId) ?? [];
  if (!list.length) return [];
  if (!defaults?.length) return list;
  const bySlot = new Map(defaults.map((d) => [d.slot, d]));
  return list.filter((entry) => {
    const fallback = bySlot.get(entry.slot);
    if (!fallback) return true;
    return (
      fallback.meshId !== entry.meshId ||
      (fallback.materialId || "") !== (entry.materialId || "")
    );
  });
}
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
      args.onProgress?.(`Loading level ${args.layoutCode}…`);
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
        args.onProgress?.("Loading saved customization…");
        const loaded = await loadCustomizationFromUe(
          args.send,
          args.designCode!,
          { mockLog: args.mockLog },
        );
        if (!loaded) {
          console.warn(
            "[UE sync] LoadCustomization missing — applying stored finishes",
          );
          args.onProgress?.("Restoring finishes…");
          await paintSelectionsToUe(
            args.send,
            entriesToPaint(args.selections, args.defaults),
            { mockLog: args.mockLog },
          );
        }
      }
    }

    args.onProgress?.("Restoring view…");
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
