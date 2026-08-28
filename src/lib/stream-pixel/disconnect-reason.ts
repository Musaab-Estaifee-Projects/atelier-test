/**
 * StreamPixel disconnect codes / reasons → overlay copy.
 * @see https://docs.streampixel.io/resources/web-sdk/features/reconnection
 */

export type DisconnectOverlayCopy = {
  eyebrow: string;
  title: string;
  status: string;
};

/** Abnormal WebSocket closures that trigger SDK auto-reconnect. */
export const RETRYABLE_CLOSE_CODES = new Set([1005, 1006]);

export const DISCONNECT_COPY = {
  dropped: {
    eyebrow: "Connection lost",
    title: "The 3D session dropped",
    status: "Disconnected from stream.",
  },
  reconnectFailed: {
    eyebrow: "Connection lost",
    title: "Unable to restore the 3D session",
    status: "Unable to reconnect. Please refresh the page.",
  },
  maxRuntime: {
    eyebrow: "Session ended",
    title: "This 3D session reached its time limit",
    status: "Maximum runtime reached.",
  },
  projectInactive: {
    eyebrow: "Unavailable",
    title: "This 3D experience is currently unavailable",
    status: "Project inactive.",
  },
  workerUnavailable: {
    eyebrow: "All sessions busy",
    title: "No 3D session is available right now",
    status: "Worker node unavailable.",
  },
  applicationNotFound: {
    eyebrow: "Unavailable",
    title: "This 3D experience could not be found",
    status: "Application not found.",
  },
  applicationError: {
    eyebrow: "Session ended",
    title: "The 3D session encountered an error",
    status: "Application error.",
  },
  noStreamer: {
    eyebrow: "Connection lost",
    title: "The 3D session is not running",
    status: "No streamer connected.",
  },
  notAvailable: {
    eyebrow: "All sessions busy",
    title: "No 3D session is available right now",
    status: "Not available.",
  },
  interrupted: {
    eyebrow: "Connection interrupted",
    title: "Reconnecting to your session",
    status: "Connection interrupted. Reconnecting…",
  },
} as const satisfies Record<string, DisconnectOverlayCopy>;

const TERMINAL_REASON_COPY: Array<{
  match: RegExp;
  copy: DisconnectOverlayCopy;
}> = [
  { match: /maximum runtime/i, copy: DISCONNECT_COPY.maxRuntime },
  { match: /project inactive/i, copy: DISCONNECT_COPY.projectInactive },
  { match: /worker node unavailable/i, copy: DISCONNECT_COPY.workerUnavailable },
  { match: /application not found/i, copy: DISCONNECT_COPY.applicationNotFound },
  { match: /application error/i, copy: DISCONNECT_COPY.applicationError },
  { match: /no streamer connected/i, copy: DISCONNECT_COPY.noStreamer },
  { match: /not available/i, copy: DISCONNECT_COPY.notAvailable },
];

export function isRetryableDisconnect(
  code?: number | null,
  reason?: string | null,
): boolean {
  if (code === 4004 || code === 4007) return false;
  if (reason && TERMINAL_REASON_COPY.some((row) => row.match.test(reason))) {
    return false;
  }
  return true;
}

export function overlayCopyForDisconnect(
  code?: number | null,
  reason?: string | null,
): DisconnectOverlayCopy {
  if (code === 4004) return DISCONNECT_COPY.maxRuntime;
  if (code === 4007) return DISCONNECT_COPY.reconnectFailed;
  if (reason) {
    const hit = TERMINAL_REASON_COPY.find((row) => row.match.test(reason));
    if (hit) return hit.copy;
  }
  return DISCONNECT_COPY.dropped;
}

export function overlayCopyForQueueMessage(
  message?: string | null,
): DisconnectOverlayCopy | null {
  if (!message) return null;
  if (/not available/i.test(message)) return DISCONNECT_COPY.notAvailable;
  if (/application not found/i.test(message)) {
    return DISCONNECT_COPY.applicationNotFound;
  }
  if (/application error/i.test(message)) return DISCONNECT_COPY.applicationError;
  return null;
}
