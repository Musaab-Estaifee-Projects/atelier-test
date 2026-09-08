type UeLogKind = "send" | "response";

export type UeLogEntry = {
  id: number;
  at: number;
  kind: UeLogKind;
  name: string;
  payload: unknown;
  ok?: boolean | null;
  inReplyTo?: number;
};

type Listener = () => void;

const MAX = 120;
const EMPTY_LOG: UeLogEntry[] = [];
const listeners = new Set<Listener>();
const entries: UeLogEntry[] = [];
let snapshot: UeLogEntry[] = EMPTY_LOG;
let nextId = 1;
let lastSendId: number | null = null;

function publish() {
  snapshot = entries.length === 0 ? EMPTY_LOG : entries.slice();
  listeners.forEach((fn) => fn());
}

function functionName(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "message";
  const obj = payload as Record<string, unknown>;
  const fn = obj.Function ?? obj.function ?? obj.type ?? obj.Type;
  return typeof fn === "string" && fn.trim() ? fn.trim() : "message";
}

function ackOk(payload: unknown): boolean | null {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;
  const code = obj.code ?? obj.Code;
  const status = String(obj.status ?? obj.Status ?? "").toLowerCase();
  if (code === 404 || status === "failed" || status === "fail" || status === "error") {
    return false;
  }
  if (code === 200 || status === "success" || status === "ok") return true;
  return null;
}

export function getUeLogEntries(): UeLogEntry[] {
  return snapshot;
}

export function getUeLogServerSnapshot(): UeLogEntry[] {
  return EMPTY_LOG;
}

export function subscribeUeLog(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function clearUeLog(): void {
  entries.length = 0;
  lastSendId = null;
  publish();
}

export function logUeSend(payload: unknown): void {
  const name = functionName(payload);
  if (name === "ConfiguratorReadyProbe") return;
  const entry: UeLogEntry = {
    id: nextId++,
    at: Date.now(),
    kind: "send",
    name,
    payload,
  };
  lastSendId = entry.id;
  entries.push(entry);
  if (entries.length > MAX) entries.splice(0, entries.length - MAX);
  publish();
}

export function logUeResponse(payload: unknown): void {
  const name = functionName(payload);
  if (name === "ConfiguratorReadyProbe") return;
  const entry: UeLogEntry = {
    id: nextId++,
    at: Date.now(),
    kind: "response",
    name,
    payload,
    ok: ackOk(payload),
    inReplyTo: lastSendId ?? undefined,
  };
  entries.push(entry);
  if (entries.length > MAX) entries.splice(0, entries.length - MAX);
  publish();
}
