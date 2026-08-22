/** Fit StreamPixel / Pixel Streaming DOM into our viewport container. */

/* eslint-disable @typescript-eslint/no-explicit-any */
export function fitStreamDom(
  container: HTMLElement | null | undefined,
  appStream: any,
  pixelStreaming?: any,
) {
  if (!container) return;

  container.style.width = "100%";
  container.style.height = "100%";
  container.style.position = container.style.position || "absolute";
  container.style.inset = container.style.inset || "0";
  container.style.overflow = "hidden";

  const root = appStream?.rootElement;
  if (root) {
    root.style.position = "absolute";
    root.style.inset = "0";
    root.style.width = "100%";
    root.style.height = "100%";
    root.style.maxWidth = "none";
    root.style.maxHeight = "none";
    root.style.margin = "0";
  }

  const videoParent =
    appStream?.stream?.videoElementParent ??
    (root?.querySelector?.("#videoElementParent") as HTMLElement | null);
  if (videoParent) {
    videoParent.style.position = "absolute";
    videoParent.style.inset = "0";
    videoParent.style.width = "100%";
    videoParent.style.height = "100%";
    videoParent.style.top = "0";
    videoParent.style.left = "0";
  }

  const video =
    (videoParent?.querySelector?.("video") as HTMLVideoElement | null) ??
    (root?.querySelector?.("video") as HTMLVideoElement | null);
  if (video) {
    video.style.position = "absolute";
    video.style.inset = "0";
    video.style.top = "0";
    video.style.left = "0";
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "cover";
    video.style.objectPosition = "center center";
    video.style.maxWidth = "none";
    video.style.maxHeight = "none";
  }

  try {
    pixelStreaming?.config?.setFlagEnabled?.("MatchViewportRes", true);
  } catch {
    /* optional */
  }

  try {
    pixelStreaming?.resizePlayerStyle?.();
    pixelStreaming?._webRtcController?.resizePlayerStyle?.();
    pixelStreaming?._webRtcController?.videoPlayer?.resizePlayerStyle?.();
    pixelStreaming?._webRtcController?.videoPlayer?.updateVideoStreamSize?.();
    appStream?.stream?.resizePlayerStyle?.();
    appStream?.stream?._webRtcController?.videoPlayer?.resizePlayerStyle?.();
  } catch {
    /* optional */
  }

  // Nudge a second pass after layout settles
  window.requestAnimationFrame(() => {
    try {
      pixelStreaming?._webRtcController?.videoPlayer?.resizePlayerStyle?.();
      pixelStreaming?._webRtcController?.videoPlayer?.updateVideoStreamSize?.();
    } catch {
      /* ignore */
    }
  });
}

type FsDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  msExitFullscreen?: () => Promise<void> | void;
};

type FsElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
  webkitEnterFullscreen?: () => void;
};

export function getFullscreenElement(): Element | null {
  const doc = document as FsDocument;
  return (
    document.fullscreenElement ??
    doc.webkitFullscreenElement ??
    null
  );
}

export async function toggleFullscreen(
  container: HTMLElement | null | undefined,
  video?: HTMLVideoElement | null,
): Promise<void> {
  if (!container && !video) return;

  const doc = document as FsDocument;
  if (getFullscreenElement()) {
    const exit =
      document.exitFullscreen?.bind(document) ??
      doc.webkitExitFullscreen?.bind(doc) ??
      doc.msExitFullscreen?.bind(doc);
    await exit?.();
    return;
  }

  const el = (container ?? video) as FsElement | null | undefined;
  if (!el) return;

  const req =
    el.requestFullscreen?.bind(el) ??
    el.webkitRequestFullscreen?.bind(el) ??
    el.msRequestFullscreen?.bind(el);

  if (req) {
    await req();
    return;
  }

  // iOS Safari: only <video> can go fullscreen
  if (video && typeof (video as FsElement).webkitEnterFullscreen === "function") {
    (video as FsElement).webkitEnterFullscreen?.();
  }
}
