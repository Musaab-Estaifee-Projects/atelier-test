/**
 * Bridge between UE command acks and in-flight senders.
 */

type LoadIdWaiter = (id: string | null) => void;

let lastLoadId: string | null = null;
const loadIdWaiters: LoadIdWaiter[] = [];

export function beginAwaitingUeLoadId(): void {
  lastLoadId = null;
}

export function noteUeLoadId(id: string | null | undefined): void {
  if (!id?.trim()) return;
  lastLoadId = id.trim();
  const pending = loadIdWaiters.splice(0, loadIdWaiters.length);
  pending.forEach((fn) => fn(lastLoadId));
}

export function getLastUeLoadId(): string | null {
  return lastLoadId;
}

export function waitForUeLoadId(ms: number): Promise<string | null> {
  if (lastLoadId) return Promise.resolve(lastLoadId);
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      const i = loadIdWaiters.indexOf(onId);
      if (i >= 0) loadIdWaiters.splice(i, 1);
      resolve(lastLoadId);
    }, ms);
    const onId: LoadIdWaiter = (id) => {
      window.clearTimeout(timer);
      resolve(id);
    };
    loadIdWaiters.push(onId);
  });
}

export type UeAckResult = {
  type: string;
  ok: boolean;
  status?: string;
  code?: number;
};

type AckWaiter = {
  types: Set<string>;
  resolve: (ack: UeAckResult) => void;
};

const ackWaiters: AckWaiter[] = [];

export function noteUeAck(ack: UeAckResult): void {
  const key = ack.type.toLowerCase();
  const index = ackWaiters.findIndex((w) => w.types.has(key));
  if (index < 0) return;
  const [waiter] = ackWaiters.splice(index, 1);
  waiter.resolve(ack);
}

export function waitForUeAck(
  types: string[],
  ms: number,
): Promise<UeAckResult | "timeout"> {
  const set = new Set(types.map((t) => t.toLowerCase()));
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      const i = ackWaiters.indexOf(waiter);
      if (i >= 0) ackWaiters.splice(i, 1);
      resolve("timeout");
    }, ms);
    const waiter: AckWaiter = {
      types: set,
      resolve: (ack) => {
        window.clearTimeout(timer);
        resolve(ack);
      },
    };
    ackWaiters.push(waiter);
  });
}

/** @deprecated use waitForUeAck(["LoadCustomization"]) */
export function beginAwaitingCustomizationLoad(): void {
  /* waiters are registered in waitForUeAck */
}

export function noteCustomizationResult(
  kind: "saved" | "loaded" | "error",
): void {
  if (kind === "saved") return;
  noteUeAck({
    type: "LoadCustomization",
    ok: kind === "loaded",
    status: kind === "loaded" ? "success" : "failed",
    code: kind === "loaded" ? 200 : 404,
  });
}

export function waitForCustomizationLoad(
  ms: number,
): Promise<"loaded" | "error" | "timeout"> {
  return waitForUeAck(["LoadCustomization"], ms).then((ack) => {
    if (ack === "timeout") return "timeout";
    return ack.ok ? "loaded" : "error";
  });
}
