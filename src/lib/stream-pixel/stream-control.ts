/**
 * StreamPixel Web SDK resolution / control helpers.
 * Docs:
 *  - https://docs.streampixel.io/resources/web-sdk/features/video-codecs-resolution
 *  - https://docs.streampixel.io/resources/web-sdk/api-reference/uicontrol
 *
 * Runtime resolution for the Web SDK must go through UIControl.handleResMax("WxH").
 * The iframe `setResolution` postMessage API must NOT be emitUIInteraction'd to UE —
 * that freezes / confuses the video track while the data channel still works.
 */

import { fitStreamDom, setMatchViewportRes } from "@/lib/stream-pixel/fit-stream";
import type { ResolutionOption } from "@/lib/stream-pixel/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const RESOLUTION_1080P: ResolutionOption = {
  label: "1080",
  width: 1920,
  height: 1080,
};

type StreamHandles = {
  pixelStreaming?: any;
  uiControl?: any;
  appStream?: any;
  container?: HTMLElement | null;
};

let lastResolution: ResolutionOption = { label: "Auto" };
let applyTimers: number[] = [];

export function getLastStreamResolution(): ResolutionOption {
  return lastResolution;
}

function isAutoResolution(option: ResolutionOption) {
  return !option.width || !option.height || option.label === "Auto";
}

function clearApplyTimers() {
  if (typeof window === "undefined") return;
  for (const id of applyTimers) window.clearTimeout(id);
  applyTimers = [];
}

function findStreamVideo(handles: StreamHandles): HTMLVideoElement | null {
  const root = handles.appStream?.rootElement as HTMLElement | null | undefined;
  const found =
    handles.appStream?.stream?.videoElementParent?.querySelector?.("video") ??
    root?.querySelector?.("video") ??
    handles.container?.querySelector?.("video");
  return found instanceof HTMLVideoElement ? found : null;
}

/** Keep the decoder painting after encoder / track renegotiation. */
export function nudgeStreamVideo(handles: StreamHandles): void {
  const video = findStreamVideo(handles);
  if (video) {
    try {
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      const play = video.play?.();
      if (play && typeof (play as Promise<void>).catch === "function") {
        (play as Promise<void>).catch(() => {});
      }
    } catch {
      /* ignore */
    }
  }

  try {
    fitStreamDom(handles.container, handles.appStream, handles.pixelStreaming);
  } catch {
    /* optional */
  }
}

function applyMatchViewport(handles: StreamHandles, enabled: boolean) {
  setMatchViewportRes(enabled);
  try {
    handles.pixelStreaming?.config?.setFlagEnabled?.(
      "MatchViewportRes",
      enabled,
    );
  } catch {
    /* optional */
  }
}

/**
 * Apply max resolution via StreamPixel UIControl only (Web SDK path).
 * Avoids iframe setResolution → emitUIInteraction (wrong channel for SDK).
 */
function applyResolutionOnce(handles: StreamHandles, option: ResolutionOption) {
  const auto = isAutoResolution(option);
  applyMatchViewport(handles, auto);

  if (auto) {
    try {
      handles.uiControl?.setResolution?.({ label: "Auto" });
    } catch {
      /* older SDK */
    }
    // Ask the player to follow the viewport again without hammering r.SetRes.
    try {
      handles.pixelStreaming?.resizePlayerStyle?.();
      handles.appStream?.stream?.resizePlayerStyle?.();
    } catch {
      /* optional */
    }
    nudgeStreamVideo(handles);
    return;
  }

  const size =
    option.width && option.height ? `${option.width}x${option.height}` : null;
  if (!size) return;

  try {
    handles.uiControl?.handleResMax?.(size);
  } catch {
    /* dashboard may lock resolution */
  }

  try {
    handles.uiControl?.setResolution?.({
      width: option.width,
      height: option.height,
      label: option.label,
    });
  } catch {
    /* optional helper on some SDK builds */
  }

  // Do NOT emitUIInteraction({ type: "setResolution" }) — that is the iframe
  // postMessage API. On the Web SDK it hits UE as a custom message and can
  // stall the video track while gameplay responses still work.
}

/**
 * Change stream resolution safely.
 * - One handleResMax / MatchViewportRes toggle
 * - Soft video.play() + DOM fit retries while the encoder settles
 * - No repeated r.SetRes / updateVideoStreamSize hammering (that freezes frames)
 */
export function setStreamResolution(
  handles: StreamHandles,
  option: ResolutionOption,
): void {
  lastResolution = option;
  clearApplyTimers();
  applyResolutionOnce(handles, option);
  nudgeStreamVideo(handles);

  if (typeof window === "undefined") return;

  // Encoder / SFU track swap is async — nudge playback without re-sending ResMax.
  applyTimers = [300, 900, 2000].map((ms) =>
    window.setTimeout(() => nudgeStreamVideo(handles), ms),
  );
}

/** Documented iframe screenshot — download fallback only if canvas capture fails. */
export function requestIframeScreenshot(handles: StreamHandles): void {
  const iframe =
    handles.container?.querySelector?.("iframe") ??
    (typeof document !== "undefined"
      ? document.querySelector(".stream-viewport iframe")
      : null);
  try {
    (iframe as HTMLIFrameElement | null)?.contentWindow?.postMessage(
      { message: "requestScreenshot" },
      "*",
    );
  } catch {
    /* ignore */
  }
}

export function sendStreamHeartbeat(handles: StreamHandles): void {
  try {
    handles.pixelStreaming?.emitUIInteraction?.({ message: "heartbeat" });
  } catch {
    /* ignore */
  }
}
