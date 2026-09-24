import { streamOverlayKind } from "@/components/configurator/loading-overlay";
import type { StreamOverlayKind } from "@/lib/configurator/loading-config";

export type StreamOverlayInput = {
  sessionError: string | null;
  hasSession: boolean;
  sessionLoading: boolean;
  sceneReady: boolean;
  dismissed: boolean;
  ueSyncStatus: string | null;
  stream: {
    isLoading: boolean;
    streamPhase: StreamOverlayKind;
    hasEverBeenReady: boolean;
    queuePosition: number | null;
    loadingTitle: string;
    loadingProgress: number;
    afkWarning: boolean;
  };
};

const BLOCKING_KINDS: ReadonlySet<StreamOverlayKind> = new Set([
  "queue",
  "disconnected",
  "idle",
  "reconnecting",
  "error",
]);

/** Which full-screen stream overlay (if any) covers the configurator. */
export function deriveStreamOverlay(input: StreamOverlayInput) {
  const { stream } = input;

  const kind: StreamOverlayKind = (() => {
    if (input.sessionError && !input.hasSession) return "error";
    if (stream.streamPhase === "disconnected" && !stream.hasEverBeenReady) {
      return "error";
    }
    if (stream.streamPhase === "idle" && !stream.hasEverBeenReady) {
      return "loading";
    }
    return streamOverlayKind({
      streamPhase: stream.streamPhase,
      queuePosition: stream.queuePosition,
      loadingTitle: stream.loadingTitle,
    });
  })();

  const blocking = stream.isLoading || BLOCKING_KINDS.has(kind);
  const show =
    kind === "error" ||
    ((blocking || input.sessionLoading || !input.sceneReady) &&
      !input.dismissed);
  const progress =
    kind === "loading" || kind === "reconnecting"
      ? Math.min(
          input.sceneReady ? 100 : 97,
          Math.max(
            input.sessionLoading ? 12 : 0,
            Math.min(stream.loadingProgress || 0, input.sceneReady ? 100 : 92),
            input.ueSyncStatus ? 96 : 0,
          ),
        )
      : stream.loadingProgress;
  const showAfkWarning = stream.afkWarning && !show && kind !== "idle";
  const offline = kind === "disconnected" || kind === "idle";

  return { kind, blocking, show, progress, showAfkWarning, offline };
}
