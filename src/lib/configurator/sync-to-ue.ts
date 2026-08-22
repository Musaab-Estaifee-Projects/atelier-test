// src/lib/configurator/sync-to-ue.ts
/**
 * Restore localStorage / design selections onto UE after reload or stream drop.
 * 1) LoadCustomization (UE snapshot)
 * 2) MoveToZone per room + SetMesh/ApplyMaterial for every stored finish
 * 3) Restore the URL camera/zone
 */
import type { SelectionEntry } from "@/types/configurator";
import type { UeInteractionPayload } from "@/lib/stream-pixel/ue-protocol";
import { getUeLoadId, loadDraft } from "@/lib/configurator/storage";
import {
  loadCustomizationFromUe,
  reconcileUeToSelections,
  restoreCameraZoneToUe,
  saveCustomizationToUe,
} from "@/lib/configurator/apply-ue";
import { normalizeZone } from "@/lib/configurator/url-params";
import {
  delay,
  sendUntilAccepted,
} from "@/lib/stream-pixel/share-restore";

type SendFn = (payload: UeInteractionPayload) => boolean;

export type SyncToUeArgs = {
  send: SendFn;
  isUeReady: () => boolean;
  streamProjectId: string;
  unitId: string | null;
  levelName: string;
  zone?: string | null;
  camera?: number | null;
  designSelections?: SelectionEntry[] | null;
  skipLoadLevel?: boolean;
  forceLoadLevel?: boolean;
  force?: boolean;
  mockLog?: boolean;
  onProgress?: (msg: string) => void;
};

let inflight: Promise<boolean> | null = null;
let inflightKey = "";
let lastCompletedKey = "";

function syncKey(args: SyncToUeArgs, list: SelectionEntry[]): string {
  return [
    args.streamProjectId,
    args.unitId ?? "",
    list.map((s) => `${s.slot}:${s.meshId}:${s.materialId}`).join(","),
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
  const draft =
    !args.designSelections && args.unitId
      ? loadDraft(args.streamProjectId, args.unitId)
      : null;

  const list: SelectionEntry[] =
    args.designSelections ?? draft?.selections ?? [];

  const zone = normalizeZone(args.zone);
  const camera =
    args.camera !== undefined && args.camera !== null ? args.camera : null;

  const key = syncKey(args, list);
  args.onProgress?.(
    list.length
      ? `Restoring ${list.length} finish(es) from storage…`
      : "Stream ready",
  );

  if (!args.force && inflight && inflightKey === key) return inflight;

  const previous = inflight;
  const runKey = args.force ? `${key}#force-${Date.now()}` : key;

  const run = async (): Promise<boolean> => {
    if (previous) await previous.catch(() => false);

    const defaultBootLevel = "2BHK_Type_2_Updated";
    const shouldLoadLevel =
      Boolean(args.levelName) &&
      (args.forceLoadLevel ||
        (!args.skipLoadLevel && args.levelName !== defaultBootLevel));

    const readLatest = (): SelectionEntry[] => {
      if (args.designSelections) return args.designSelections;
      if (args.unitId) {
        return loadDraft(args.streamProjectId, args.unitId)?.selections ?? [];
      }
      return list;
    };

    if (!(await waitUntilReady(args.isUeReady, args.mockLog))) {
      console.warn("[UE sync] stream never ready");
      return !readLatest().length;
    }
    await delay(500);
    if (!args.mockLog && !(await waitUntilEmitAccepted(args.send))) {
      console.warn("[UE sync] emit never accepted");
      return !readLatest().length;
    }

    if (shouldLoadLevel && args.levelName) {
      args.onProgress?.(`Loading level ${args.levelName}…`);
      await sendUntilAccepted(
        args.send,
        { Function: "LoadLevel", LevelName: args.levelName },
        { attempts: 10, gapMs: 400, label: "LoadLevel" },
      );
      await delay(2200);
      await waitUntilEmitAccepted(args.send);
    }

    const freshList = readLatest();
    const loadId =
      (args.unitId
        ? getUeLoadId(args.streamProjectId, args.unitId)
        : null) ?? args.unitId;

    if (freshList.length && loadId) {
      args.onProgress?.("Loading saved customization…");
      await loadCustomizationFromUe(args.send, {
        loadId,
        unitId: args.unitId,
        mockLog: args.mockLog,
      });
    }

    // Never ResetCustomization here — that wipes slots this Blueprint only
    // paints while the matching camera is active.
    const ok = await reconcileUeToSelections(args.send, freshList, {
      mockLog: args.mockLog,
      resetFirst: false,
      onProgress: args.onProgress,
    });

    if (freshList.length && args.unitId) {
      await saveCustomizationToUe(args.send, {
        unitId: args.unitId,
        streamProjectId: args.streamProjectId,
        selections: freshList,
        mockLog: args.mockLog,
      });
    }

    args.onProgress?.("Restoring view…");
    await restoreCameraZoneToUe(args.send, {
      zone,
      camera,
      mockLog: args.mockLog,
    });

    lastCompletedKey = key;
    if (!ok && freshList.length) {
      console.warn("[UE sync] some finishes did not confirm");
      return false;
    }
    console.info(
      `[UE sync] done — ${freshList.length} finish(es) via LoadCustomization + MoveToZone`,
    );
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
