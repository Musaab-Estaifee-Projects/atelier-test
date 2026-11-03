/**
 * StreamPixel Web SDK resolution helpers.
 *
 * Docs:
 *  - https://docs.streampixel.io/resources/web-sdk/features/video-codecs-resolution
 *  - https://docs.streampixel.io/resources/web-sdk/api-reference/uicontrol
 *  - https://docs.streampixel.io/resources/recipes/performance-tuning
 *
 * Runtime changes: UIControl.handleResMax("WIDTHxHEIGHT") only.
 * StreamPixel owns UE size (r.SetRes). Never enable MatchViewportRes and never
 * emit iframe `setResolution` — both freeze the video track.
 */

import { fitStreamDom } from "@/lib/stream-pixel/fit-stream";
import type { ResolutionOption } from "@/lib/stream-pixel/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const RESOLUTION_1080P: ResolutionOption = {
  label: "1080",
  width: 1920,
  height: 1080,
};

/** Auto ceiling — configurator target from StreamPixel perf guide. */
const AUTO_MAX_RES = "1920x1080";

type StreamHandles = {
  pixelStreaming?: any;
  uiControl?: any;
  appStream?: any;
  container?: HTMLElement | null;
};

let lastResolution: ResolutionOption = { label: "Auto" };
let applyTimers: number[] = [];
let applying = false;

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

/** Soft recovery: keep decoding without touching MatchViewportRes / resizePlayerStyle. */
export function nudgeStreamVideo(handles: StreamHandles): void {
  try {
    handles.pixelStreaming?.config?.setFlagEnabled?.("MatchViewportRes", false);
  } catch {
    /* optional */
  }

  const video = findStreamVideo(handles);
  if (video) {
    try {
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      void video.play?.()?.catch?.(() => {});
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

function resMaxValue(option: ResolutionOption): string {
  if (isAutoResolution(option)) return AUTO_MAX_RES;
  return `${option.width}x${option.height}`;
}

/**
 * Apply resolution the StreamPixel-documented way: one handleResMax call.
 * Do not re-send ResMax on settle — that re-fires r.SetRes and freezes frames.
 */
export function setStreamResolution(
  handles: StreamHandles,
  option: ResolutionOption,
): void {
  if (applying) return;
  applying = true;

  lastResolution = option;
  clearApplyTimers();

  try {
    handles.pixelStreaming?.config?.setFlagEnabled?.("MatchViewportRes", false);
  } catch {
    /* optional */
  }

  const value = resMaxValue(option);
  try {
    handles.uiControl?.handleResMax?.(value);
  } catch {
    /* dashboard may lock resolution */
  }

  nudgeStreamVideo(handles);

  window.setTimeout(() => {
    applying = false;
  }, 500);

  if (typeof window === "undefined") return;

  // Soft settle only — play + DOM fill, never another handleResMax.
  applyTimers = [400, 1200].map((ms) =>
    window.setTimeout(() => {
      nudgeStreamVideo(handles);
    }, ms),
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
