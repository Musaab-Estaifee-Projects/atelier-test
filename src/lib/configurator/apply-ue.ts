/**
 * Paint UE from the FE selection map.
 * Atelier Blueprints apply in the active camera/zone context, so restore
 * must MoveToZone → SwitchCameraByIndex → SetMesh → ApplyMaterial per slot.
 */
import type { ConfiguratorSession, SelectionEntry } from "@/types/configurator";
import type { UeInteractionPayload } from "@/lib/stream-pixel/ue-protocol";
import { DEFAULT_MESH_RULES } from "@/lib/configurator/mesh-rules";
import { resolveCameraIndexForSelection } from "@/lib/configurator/resolve-camera-index";
import {
  moveZoneName,
  zoneIdFromCamera,
  zoneIdFromSlot,
} from "@/lib/configurator/zone-catalog";
import {
  getUeLoadId,
  loadDraft,
  saveUeLoadId,
} from "@/lib/configurator/storage";
import {
  getLastUeLoadId,
  beginAwaitingUeLoadId,
  waitForUeLoadId,
} from "@/lib/configurator/ue-load-id";
import { delay, sendUntilAccepted } from "@/lib/stream-pixel/share-restore";

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

function enrichEntry(entry: SelectionEntry): SelectionEntry {
  const cameraIndex =
    entry.cameraIndex ??
    resolveCameraIndexForSelection(entry, {
      sessionCameras: DEFAULT_MESH_RULES.cameras,
    }) ??
    undefined;
  const cam =
    DEFAULT_MESH_RULES.cameras.find((c) => {
      if (cameraIndex != null && Number(c.index) === Number(cameraIndex)) {
        return true;
      }
      if (entry.cameraId && c.name === entry.cameraId) return true;
      return Boolean(c.meshIds?.includes(entry.meshId));
    }) ?? undefined;
  return {
    ...entry,
    cameraIndex:
      cameraIndex ??
      (cam?.index != null ? Number(cam.index) : entry.cameraIndex),
    cameraId: entry.cameraId ?? cam?.name,
  };
}

function toConfigRows(list: SelectionEntry[]) {
  return list.map((s) => {
    const e = enrichEntry(s);
    return {
      Slot: e.slot,
      MeshName: e.meshId,
      MaterialName: e.materialId,
      CameraName: e.cameraId,
      CameraIndex: e.cameraIndex,
    };
  });
}

export function zoneNameForEntry(entry: SelectionEntry): string | null {
  const e = enrichEntry(entry);
  const fromSlot = zoneIdFromSlot(e.slot);
  const fromCam = zoneIdFromCamera({ name: e.cameraId });
  return moveZoneName(fromSlot ?? fromCam);
}

export async function moveToZoneOnUe(
  send: SendFn,
  zoneName: string | null | undefined,
  opts?: { mockLog?: boolean },
): Promise<void> {
  const name = zoneName?.trim();
  if (!name) return;
  if (opts?.mockLog) {
    console.info("[mock UE] MoveToZone", name);
    return;
  }
  await sendUntilAccepted(
    send,
    { Function: "MoveToZone", ZoneName: name },
    { attempts: 10, gapMs: 280, label: `MoveToZone ${name}` },
  );
  send({ Function: "EnterZone", ZoneName: name });
  send({ Function: "GoToZone", ZoneName: name });
  await delay(450);
}

async function switchCameraOnUe(
  send: SendFn,
  entry: SelectionEntry,
  zoneName: string | null,
  opts?: { mockLog?: boolean },
): Promise<void> {
  const e = enrichEntry(entry);
  if (e.cameraIndex == null || Number.isNaN(e.cameraIndex)) {
    if (e.cameraId) {
      send({
        Function: "SwitchCameraByName",
        CameraName: e.cameraId,
      });
      await delay(350);
    }
    return;
  }
  if (opts?.mockLog) {
    console.info("[mock UE] SwitchCamera", e.cameraIndex, zoneName);
    return;
  }
  await sendUntilAccepted(
    send,
    {
      Function: "SwitchCameraByIndex",
      Index: e.cameraIndex,
      ...(zoneName ? { ZoneName: zoneName } : {}),
      ...(e.cameraId ? { CameraName: e.cameraId } : {}),
    },
    { attempts: 12, gapMs: 300, label: `SwitchCamera ${e.cameraIndex}` },
  );
  await delay(450);
}

async function paintEntry(
  send: SendFn,
  entry: SelectionEntry,
  opts?: { mockLog?: boolean; attempts?: number },
): Promise<boolean> {
  const e = enrichEntry(entry);
  if (opts?.mockLog) {
    console.info("[mock UE] SetMesh/ApplyMaterial", e);
    return true;
  }
  const attempts = opts?.attempts ?? 16;
  const extra = {
    ...(e.slot ? { Slot: e.slot } : {}),
    ...(e.cameraId ? { CameraName: e.cameraId } : {}),
    ...(e.cameraIndex != null
      ? { CameraIndex: e.cameraIndex, Index: e.cameraIndex }
      : {}),
  };
  const meshOk = await sendUntilAccepted(
    send,
    { Function: "SetMeshByName", MeshName: e.meshId, ...extra },
    { attempts, gapMs: 280, label: `SetMesh ${e.meshId}` },
  );
  if (!meshOk) return false;
  await delay(280);
  if (!e.materialId) return true;

  const matPayload: UeInteractionPayload = {
    Function: "ApplyMaterialToMesh",
    MeshName: e.meshId,
    MaterialName: e.materialId,
    ...extra,
  };
  const matOk = await sendUntilAccepted(send, matPayload, {
    attempts,
    gapMs: 280,
    label: `ApplyMaterial ${e.materialId}`,
  });
  if (!matOk) return false;
  await delay(180);
  await sendUntilAccepted(send, matPayload, {
    attempts: 6,
    gapMs: 250,
    label: `ApplyMaterial² ${e.materialId}`,
  });
  return true;
}

/** One finish in the correct zone + camera. */
export async function applyEntryWithZone(
  send: SendFn,
  entry: SelectionEntry,
  opts?: { mockLog?: boolean; skipMove?: boolean; lastZone?: string | null },
): Promise<{ ok: boolean; zone: string | null }> {
  const zone = zoneNameForEntry(entry);
  if (!opts?.skipMove && zone && zone !== opts?.lastZone) {
    await moveToZoneOnUe(send, zone, { mockLog: opts?.mockLog });
  }
  await switchCameraOnUe(send, entry, zone, { mockLog: opts?.mockLog });
  const ok = await paintEntry(send, entry, { mockLog: opts?.mockLog });
  return { ok, zone };
}

async function applyGrouped(
  send: SendFn,
  selections: SelectionEntry[],
  opts?: { mockLog?: boolean; onProgress?: (msg: string) => void },
): Promise<SelectionEntry[]> {
  const list = selections.map(enrichEntry);
  const zoneOrder = ["LivingArea", "Kitchen", "bedroom-1", "bedroom-2"];
  const groups = new Map<string, SelectionEntry[]>();
  for (const entry of list) {
    const zone = zoneNameForEntry(entry) ?? "_";
    const bucket = groups.get(zone) ?? [];
    bucket.push(entry);
    groups.set(zone, bucket);
  }

  const orderedZones = [
    ...zoneOrder.filter((z) => groups.has(z)),
    ...[...groups.keys()].filter((z) => !zoneOrder.includes(z)),
  ];

  const pending: SelectionEntry[] = [];
  for (const zone of orderedZones) {
    const entries = groups.get(zone) ?? [];
    opts?.onProgress?.(
      zone === "_"
        ? `Applying ${entries.length} finish(es)…`
        : `Applying ${zone}…`,
    );
    if (zone !== "_") {
      await moveToZoneOnUe(send, zone, { mockLog: opts?.mockLog });
    }
    for (const entry of entries) {
      await switchCameraOnUe(send, entry, zone === "_" ? null : zone, {
        mockLog: opts?.mockLog,
      });
      const ok = await paintEntry(send, entry, { mockLog: opts?.mockLog });
      if (!ok) pending.push(entry);
      else await delay(120);
    }
  }
  return pending;
}

export async function saveCustomizationToUe(
  send: SendFn,
  opts: {
    unitId?: string | null;
    streamProjectId?: string;
    selections?: SelectionEntry[];
    mockLog?: boolean;
  },
): Promise<string | null> {
  const unitId = opts.unitId?.trim() || undefined;
  const existing =
    opts.streamProjectId && unitId
      ? getUeLoadId(opts.streamProjectId, unitId)
      : getLastUeLoadId();
  const selections = opts.selections ?? [];

  if (opts.mockLog) {
    console.info("[mock UE] SaveCustomization", {
      unitId,
      existing,
      selections,
    });
    return existing ?? unitId ?? null;
  }

  beginAwaitingUeLoadId();
  await sendUntilAccepted(
    send,
    {
      Function: "SaveCustomization",
      ...(unitId ? { UnitId: unitId } : {}),
      ...(existing ? { LoadID: existing } : {}),
      ...(selections.length ? { Selections: toConfigRows(selections) } : {}),
    },
    { attempts: 8, gapMs: 250, label: "SaveCustomization" },
  );

  const fromUe = await waitForUeLoadId(1200);
  const loadId = fromUe ?? existing ?? unitId ?? null;
  if (loadId && opts.streamProjectId && unitId) {
    saveUeLoadId(opts.streamProjectId, unitId, loadId);
  }
  return loadId;
}

export async function loadCustomizationFromUe(
  send: SendFn,
  opts: {
    loadId?: string | null;
    unitId?: string | null;
    mockLog?: boolean;
  },
): Promise<boolean> {
  const loadId = (opts.loadId || opts.unitId || "").trim();
  if (!loadId) return false;
  if (opts.mockLog) {
    console.info("[mock UE] LoadCustomization", loadId);
    return true;
  }
  const ok = await sendUntilAccepted(
    send,
    {
      Function: "LoadCustomization",
      LoadID: loadId,
      ...(opts.unitId ? { UnitId: opts.unitId } : {}),
    },
    { attempts: 10, gapMs: 300, label: `LoadCustomization ${loadId}` },
  );
  if (ok) await delay(700);
  return ok;
}

export async function reconcileUeToSelections(
  send: SendFn,
  selections: SelectionEntry[],
  opts?: {
    mockLog?: boolean;
    resetFirst?: boolean;
    onProgress?: (msg: string) => void;
  },
): Promise<boolean> {
  return enqueueApply(async () => {
    if (opts?.resetFirst) {
      opts.onProgress?.("Resetting finishes…");
      if (opts.mockLog) console.info("[mock UE] ResetCustomization");
      else {
        await sendUntilAccepted(
          send,
          { Function: "ResetCustomization" },
          { attempts: 10, gapMs: 250, label: "ResetCustomization" },
        );
        await delay(500);
      }
    }

    if (!selections.length) return true;

    const list = selections.map(enrichEntry);
    opts?.onProgress?.(`Applying ${list.length} finish(es)…`);

    if (!opts?.mockLog) {
      await sendUntilAccepted(
        send,
        { Function: "ApplyConfiguration", Selections: toConfigRows(list) },
        { attempts: 6, gapMs: 250, label: "ApplyConfiguration" },
      );
      await delay(200);
    }

    let pending = await applyGrouped(send, list, opts);
    if (pending.length) {
      opts?.onProgress?.("Retrying unfinished finishes…");
      pending = await applyGrouped(send, pending, opts);
    }
    if (pending.length) {
      console.warn(
        "[UE] apply incomplete",
        pending.map((s) => s.slot),
      );
      return false;
    }
    return true;
  });
}

export async function resetCustomizationOnUe(
  send: SendFn,
  opts?: { mockLog?: boolean },
): Promise<void> {
  await enqueueApply(async () => {
    if (opts?.mockLog) {
      console.info("[mock UE] ResetCustomization");
      return;
    }
    await sendUntilAccepted(
      send,
      { Function: "ResetCustomization" },
      { attempts: 10, gapMs: 250, label: "ResetCustomization" },
    );
    await delay(400);
  });
}

export async function revertSlotOnUe(
  send: SendFn,
  _session: ConfiguratorSession,
  slot: string,
  remaining: SelectionEntry[],
  opts?: {
    mockLog?: boolean;
    zone?: string | null;
    camera?: number | null;
    unitId?: string | null;
    streamProjectId?: string;
  },
): Promise<void> {
  if (opts?.mockLog) {
    console.info("[mock UE] revert slot", slot, {
      remaining: remaining.length,
    });
  } else {
    send({ Function: "ResetSlot", Slot: slot });
    send({ Function: "ClearSlot", Slot: slot });
    send({ Function: "ResetMeshBySlot", Slot: slot });
    await delay(180);
  }

  await reconcileUeToSelections(send, remaining, {
    mockLog: opts?.mockLog,
    resetFirst: true,
  });
  if (opts?.streamProjectId) {
    await saveCustomizationToUe(send, {
      unitId: opts.unitId,
      streamProjectId: opts.streamProjectId,
      selections: remaining,
      mockLog: opts.mockLog,
    });
  }
  await restoreCameraZoneToUe(send, {
    zone: opts?.zone,
    camera: opts?.camera,
    mockLog: opts?.mockLog,
  });
}

export async function applySelectionsToUe(
  send: SendFn,
  selections: SelectionEntry[],
  opts?: { mockLog?: boolean; gapMs?: number },
): Promise<void> {
  void opts?.gapMs;
  await reconcileUeToSelections(send, selections, {
    mockLog: opts?.mockLog,
    resetFirst: false,
  });
}

export async function applyOneSelectionToUe(
  send: SendFn,
  entry: SelectionEntry,
  opts?: {
    mockLog?: boolean;
    cameraIndex?: number | null;
    zone?: string | null;
    skipMove?: boolean;
    unitId?: string | null;
    streamProjectId?: string;
  },
): Promise<void> {
  await enqueueApply(async () => {
    const zone = opts?.zone ? moveZoneName(opts.zone) : zoneNameForEntry(entry);
    if (!opts?.skipMove && zone) {
      await moveToZoneOnUe(send, zone, { mockLog: opts?.mockLog });
    }
    const camIndex =
      opts?.cameraIndex ?? enrichEntry(entry).cameraIndex ?? null;
    if (camIndex != null) {
      await switchCameraOnUe(send, { ...entry, cameraIndex: camIndex }, zone, {
        mockLog: opts?.mockLog,
      });
    }
    await paintEntry(send, entry, { mockLog: opts?.mockLog });
  });

  if (opts?.streamProjectId && opts.unitId) {
    const selections = loadDraft(opts.streamProjectId, opts.unitId)
      ?.selections ?? [entry];
    void saveCustomizationToUe(send, {
      unitId: opts.unitId,
      streamProjectId: opts.streamProjectId,
      selections,
      mockLog: opts.mockLog,
    });
  }
}

export async function restoreCameraZoneToUe(
  send: SendFn,
  opts: {
    zone?: string | null;
    camera?: number | null;
    mockLog?: boolean;
  },
): Promise<void> {
  const zone = moveZoneName(opts.zone) ?? opts.zone ?? null;
  if (zone) await moveToZoneOnUe(send, zone, { mockLog: opts.mockLog });
  if (opts.camera != null) {
    if (opts.mockLog) console.info("[mock UE] SwitchCamera", opts.camera);
    await sendUntilAccepted(
      send,
      {
        Function: "SwitchCameraByIndex",
        Index: opts.camera,
        ...(zone ? { ZoneName: zone } : {}),
      },
      { attempts: 10, gapMs: 350, label: `SwitchCamera ${opts.camera}` },
    );
  }
}
