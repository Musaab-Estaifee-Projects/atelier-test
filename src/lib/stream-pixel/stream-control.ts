/**
 * StreamPixel iframe / SDK control messages.
 * Docs: https://docs.streampixel.io/resources/iframe-integration/stream-control-commands
 *
 * This app uses the Web SDK (not a parent iframe). We still:
 *  1) call UIControl.handleResMax / setResolution when present
 *  2) emitUIInteraction with the documented message shape
 *  3) postMessage any nested iframe as a fallback
 */

import { setMatchViewportRes } from "@/lib/stream-pixel/fit-stream";
import type { ResolutionOption } from "@/lib/stream-pixel/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const RESOLUTION_1080P: ResolutionOption = {
  label: "1080",
  width: 1920,
  height: 1080,
};

/** StreamPixel only accepts these exact strings for iframe setResolution. */
const RESOLUTION_COMMAND: Record<string, string> = {
  "360": "360p (640x360)",
  "480": "480p (854x480)",
  "720": "720p (1280x720)",
  "1080": "1080p (1920x1080)",
  "1440": "1440p (2560x1440)",
  "4K": "4K (3840x2160)",
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

export function streamResolutionCommand(option: ResolutionOption): string | null {
  if (isAutoResolution(option)) return null;
  return (
    RESOLUTION_COMMAND[option.label] ??
    (option.width && option.height
      ? `${option.label}p (${option.width}x${option.height})`
      : null)
  );
}

function postToStreamIframe(container: HTMLElement | null | undefined, data: unknown) {
  const iframe =
    container?.querySelector?.("iframe") ??
    (typeof document !== "undefined"
      ? document.querySelector(".stream-viewport iframe")
      : null);
  try {
    (iframe as HTMLIFrameElement | null)?.contentWindow?.postMessage(data, "*");
  } catch {
    /* cross-origin / missing iframe is fine */
  }
}

export function sendStreamControl(handles: StreamHandles, payload: unknown): void {
  postToStreamIframe(handles.container, payload);
  try {
    handles.pixelStreaming?.emitUIInteraction?.(payload);
  } catch {
    /* ignore */
  }
  try {
    handles.appStream?.stream?.emitUIInteraction?.(payload);
  } catch {
    /* ignore */
  }
}

function applyMatchViewport(handles: StreamHandles, enabled: boolean) {
  setMatchViewportRes(enabled);
  try {
    handles.pixelStreaming?.config?.setFlagEnabled?.("MatchViewportRes", enabled);
  } catch {
    /* optional */
  }
}

function applyResolutionOnce(handles: StreamHandles, option: ResolutionOption) {
  const auto = isAutoResolution(option);
  applyMatchViewport(handles, auto);

  const size =
    option.width && option.height ? `${option.width}x${option.height}` : null;

  if (size) {
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
      /* older SDK shape */
    }
  } else {
    try {
      handles.uiControl?.setResolution?.({ label: "Auto" });
    } catch {
      /* ignore */
    }
  }

  const value = streamResolutionCommand(option);
  if (value) {
    sendStreamControl(handles, { message: { type: "setResolution", value } });
  }

  if (auto) {
    try {
      handles.pixelStreaming?.resizePlayerStyle?.();
      handles.pixelStreaming?._webRtcController?.resizePlayerStyle?.();
      handles.pixelStreaming?._webRtcController?.videoPlayer?.updateVideoStreamSize?.();
      handles.appStream?.stream?.resizePlayerStyle?.();
    } catch {
      /* optional */
    }
  }
}

function clearApplyTimers() {
  if (typeof window === "undefined") return;
  for (const id of applyTimers) window.clearTimeout(id);
  applyTimers = [];
}

export function setStreamResolution(
  handles: StreamHandles,
  option: ResolutionOption,
): void {
  lastResolution = option;
  applyResolutionOnce(handles, option);

  if (typeof window === "undefined") return;
  clearApplyTimers();
  // Encoder / SFU often ignore the first request until the video track settles.
  applyTimers = [200, 700].map((ms) =>
    window.setTimeout(() => applyResolutionOnce(handles, option), ms),
  );
}

/** Documented iframe screenshot — download fallback only if canvas capture fails. */
export function requestIframeScreenshot(handles: StreamHandles): void {
  sendStreamControl(handles, { message: "requestScreenshot" });
}

export function sendStreamHeartbeat(handles: StreamHandles): void {
  sendStreamControl(handles, { message: "heartbeat" });
}
