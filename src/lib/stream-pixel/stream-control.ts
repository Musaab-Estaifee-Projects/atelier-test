/**
 * StreamPixel iframe / SDK control messages.
 * Docs: https://docs.streampixel.io/resources/iframe-integration/stream-control-commands
 *
 * This app uses the Web SDK (not a parent iframe). We still:
 *  1) call UIControl.setResolution when present
 *  2) emitUIInteraction with the documented message shape
 *  3) postMessage any nested iframe as a fallback
 *
 * Screenshot: iframe `requestScreenshot` auto-downloads. We capture the
 * <video> frame ourselves (capture-frame.ts) so the viewer can display it.
 */

import type { ResolutionOption } from "@/lib/stream-pixel/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const RESOLUTION_1080P: ResolutionOption = {
  label: "1080p",
  width: 1920,
  height: 1080,
};

const RESOLUTION_LABEL: Record<string, string> = {
  "720p": "720p (1280x720)",
  "1080p": "1080p (1920x1080)",
  "1440p": "1440p (2560x1440)",
};

type StreamHandles = {
  pixelStreaming?: any;
  uiControl?: any;
  container?: HTMLElement | null;
};

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
}

export function setStreamResolution(
  handles: StreamHandles,
  option: ResolutionOption,
): void {
  try {
    if (option.width && option.height) {
      handles.uiControl?.setResolution?.({
        width: option.width,
        height: option.height,
        label: option.label,
      });
    } else {
      handles.uiControl?.setResolution?.({ label: option.label });
    }
  } catch {
    /* dashboard may lock resolution */
  }

  const value =
    RESOLUTION_LABEL[option.label] ??
    (option.width && option.height
      ? `${option.label} (${option.width}x${option.height})`
      : option.label);

  const msg = { message: { type: "setResolution", value } };
  sendStreamControl(handles, msg);
}

/** Documented iframe screenshot — download fallback only if canvas capture fails. */
export function requestIframeScreenshot(handles: StreamHandles): void {
  sendStreamControl(handles, { message: "requestScreenshot" });
}

export function sendStreamHeartbeat(handles: StreamHandles): void {
  sendStreamControl(handles, { message: "heartbeat" });
}
