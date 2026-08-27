/** Fit StreamPixel / Pixel Streaming DOM into our viewport container. */

/* eslint-disable @typescript-eslint/no-explicit-any */

function fillBox(el: HTMLElement | null | undefined, cover = false) {
  if (!el) return;
  el.style.setProperty("position", "absolute", "important");
  el.style.setProperty("inset", "0px", "important");
  el.style.setProperty("top", "0px", "important");
  el.style.setProperty("right", "0px", "important");
  el.style.setProperty("bottom", "0px", "important");
  el.style.setProperty("left", "0px", "important");
  el.style.setProperty("width", "100%", "important");
  el.style.setProperty("height", "100%", "important");
  el.style.setProperty("min-width", "100%", "important");
  el.style.setProperty("min-height", "100%", "important");
  el.style.setProperty("max-width", "none", "important");
  el.style.setProperty("max-height", "none", "important");
  el.style.setProperty("margin", "0px", "important");
  el.style.setProperty("padding", "0px", "important");
  el.style.setProperty("transform", "none", "important");
  if (cover) {
    el.style.setProperty("object-fit", "cover", "important");
    el.style.setProperty("object-position", "center center", "important");
  }
}

function streamMedia(
  appStream: any,
  root?: HTMLElement | null,
): HTMLElement | null {
  const parent =
    (appStream?.stream?.videoElementParent as HTMLElement | null) ??
    (root?.querySelector?.("#videoElementParent") as HTMLElement | null);
  return (
    (parent?.querySelector?.("video") as HTMLElement | null) ??
    (root?.querySelector?.("video") as HTMLElement | null) ??
    (root?.querySelector?.("canvas") as HTMLElement | null)
  );
}

function mediaMissesContainer(
  container: HTMLElement,
  media: HTMLElement | null,
): boolean {
  if (!media) return true;
  return (
    Math.abs(media.clientWidth - container.clientWidth) > 2 ||
    Math.abs(media.clientHeight - container.clientHeight) > 2
  );
}

export function fitStreamDom(
  container: HTMLElement | null | undefined,
  appStream: any,
  pixelStreaming?: any,
) {
  if (!container) return;

  fillBox(container);
  container.style.setProperty("overflow", "hidden", "important");

  const root = appStream?.rootElement as HTMLElement | null | undefined;
  fillBox(root);

  const videoParent =
    (appStream?.stream?.videoElementParent as HTMLElement | null) ??
    (root?.querySelector?.("#videoElementParent") as HTMLElement | null);
  fillBox(videoParent);

  const playerUi =
    (root?.querySelector?.("#playerUI") as HTMLElement | null) ??
    (root?.querySelector?.(".playerUI") as HTMLElement | null);
  fillBox(playerUi);

  const media = streamMedia(appStream, root);
  fillBox(media, true);

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

  // SDK resize letterboxes to stream aspect — stretch back to the shell.
  fillBox(container);
  fillBox(root);
  fillBox(playerUi);
  fillBox(videoParent);
  fillBox(streamMedia(appStream, root), true);

  window.requestAnimationFrame(() => {
    fillBox(container);
    fillBox(root);
    fillBox(playerUi);
    fillBox(videoParent);
    fillBox(streamMedia(appStream, root), true);
  });
}

/** Re-apply fill when the SDK resizes the player after a camera / resolution change. */
export function watchStreamFill(
  container: HTMLElement | null | undefined,
  appStream: any,
  pixelStreaming?: any,
): () => void {
  if (!container) return () => {};

  let fitting = false;
  const apply = () => {
    if (fitting) return;
    const media = streamMedia(
      appStream,
      appStream?.rootElement as HTMLElement | null,
    );
    if (!mediaMissesContainer(container, media) && media) return;
    fitting = true;
    fitStreamDom(container, appStream, pixelStreaming);
    window.requestAnimationFrame(() => {
      fitting = false;
    });
  };

  const ro = new ResizeObserver(apply);
  ro.observe(container);
  const root = appStream?.rootElement as HTMLElement | null | undefined;
  const parent =
    (appStream?.stream?.videoElementParent as HTMLElement | null) ??
    (root?.querySelector?.("#videoElementParent") as HTMLElement | null);
  const media = streamMedia(appStream, root);
  if (parent) ro.observe(parent);
  if (media) ro.observe(media);

  const mo = new MutationObserver(apply);
  if (media) {
    mo.observe(media, {
      attributes: true,
      attributeFilter: ["style", "width", "height", "class"],
    });
  }
  if (parent) {
    mo.observe(parent, {
      attributes: true,
      attributeFilter: ["style", "class"],
    });
  }

  media?.addEventListener("resize", apply);
  media?.addEventListener("loadedmetadata", apply);

  return () => {
    ro.disconnect();
    mo.disconnect();
    media?.removeEventListener("resize", apply);
    media?.removeEventListener("loadedmetadata", apply);
  };
}

export function waitForVideoFrame(
  video: HTMLVideoElement | null | undefined,
  timeoutMs = 20000,
): Promise<boolean> {
  if (!video) return Promise.resolve(false);

  const hasPainted = () =>
    video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
    video.videoWidth > 2 &&
    video.videoHeight > 2;

  if (hasPainted()) return Promise.resolve(true);

  return new Promise((resolve) => {
    let settled = false;
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("canplay", onReady);
      video.removeEventListener("playing", onReady);
      video.removeEventListener("resize", onReady);
      resolve(ok);
    };
    const onReady = () => {
      if (hasPainted()) done(true);
    };
    const timer = window.setTimeout(() => done(hasPainted()), timeoutMs);

    if (typeof video.requestVideoFrameCallback === "function") {
      const onFrame = () => {
        if (video.videoWidth > 2 && video.videoHeight > 2) done(true);
      };
      video.requestVideoFrameCallback(onFrame);
    }

    video.addEventListener("loadeddata", onReady);
    video.addEventListener("canplay", onReady);
    video.addEventListener("playing", onReady);
    video.addEventListener("resize", onReady);
    video.play?.().catch(() => {});
    onReady();
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
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
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

  if (
    video &&
    typeof (video as FsElement).webkitEnterFullscreen === "function"
  ) {
    (video as FsElement).webkitEnterFullscreen?.();
  }
}
