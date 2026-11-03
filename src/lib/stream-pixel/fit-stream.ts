/** Fit StreamPixel / Pixel Streaming DOM into our viewport container. */

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Auto follows the viewport; a picked resolution must not be overwritten. */
let matchViewportRes = true;

/**
 * While the materials drawer animates the stream band, lock stretch-fill and
 * skip SDK `resizePlayerStyle` (that call letterboxes to aspect ratio mid-tween).
 */
let streamStretchLock = false;

export function setMatchViewportRes(enabled: boolean) {
  matchViewportRes = enabled;
}

export function shouldMatchViewportRes() {
  return matchViewportRes;
}

export function setStreamStretchLock(locked: boolean) {
  streamStretchLock = locked;
  if (typeof document !== "undefined") {
    const shell = document.querySelector(".configurator-shell");
    if (shell instanceof HTMLElement) {
      if (locked) shell.setAttribute("data-stream-stretch", "");
      else shell.removeAttribute("data-stream-stretch");
    }
  }
}

export function isStreamStretchLocked() {
  return streamStretchLock;
}

const GEOMETRY_PROPS = [
  "inset",
  "top",
  "right",
  "bottom",
  "left",
  "width",
  "height",
  "min-width",
  "min-height",
  "max-width",
  "max-height",
  "margin",
  "padding",
  "transform",
] as const;

/**
 * `.stream-viewport` size is owned by CSS (full-bleed vs materials-drawer
 * compact band). Never stamp inline geometry on the container — that would
 * override drawer layout with `inset:0; height:100% !important`.
 */
function releaseContainerGeometry(el: HTMLElement) {
  for (const prop of GEOMETRY_PROPS) {
    el.style.removeProperty(prop);
  }
  el.style.setProperty("position", "absolute", "important");
  el.style.setProperty("overflow", "hidden", "important");
}

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

function fillMedia(el: HTMLElement | null | undefined, stretch: boolean) {
  fillBox(el, !stretch);
  if (!el || !stretch) return;
  // Stretch-fill — SDK aspect-fit letterbox reads as the video "shrinking".
  el.style.setProperty("object-fit", "fill", "important");
  el.style.setProperty("object-position", "center center", "important");
}

function shouldStretchStream(container: HTMLElement) {
  // Only an explicit lock — materials drawer uses CSS translate (no resize).
  return (
    streamStretchLock ||
    Boolean(
      container.closest?.("[data-stream-stretch]") ||
      document.querySelector?.(".configurator-shell[data-stream-stretch]"),
    )
  );
}

export function fitStreamDom(
  container: HTMLElement | null | undefined,
  appStream: any,
  pixelStreaming?: any,
) {
  if (!container) return;

  const stretch = shouldStretchStream(container);

  // Never stamp width/height/transform on the viewport — CSS owns full-bleed
  // size and the materials-drawer translateY shift.
  releaseContainerGeometry(container);
  // Preserve CSS transform (drawer push); only clear stale inline transform.
  container.style.removeProperty("transform");

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

  fillMedia(streamMedia(appStream, root), stretch);

  try {
    pixelStreaming?.config?.setFlagEnabled?.(
      "MatchViewportRes",
      matchViewportRes,
    );
  } catch {
    /* optional */
  }

  // Do not call resizePlayerStyle / updateVideoStreamSize here.
  // Those fight MatchViewportRes and freeze the decoder right after a
  // resolution change; DOM fill below is enough for layout.

  releaseContainerGeometry(container);
  container.style.removeProperty("transform");
  fillBox(root);
  fillBox(playerUi);
  fillBox(videoParent);
  fillMedia(streamMedia(appStream, root), stretch);

  window.requestAnimationFrame(() => {
    releaseContainerGeometry(container);
    container.style.removeProperty("transform");
    fillBox(root);
    fillBox(playerUi);
    fillBox(videoParent);
    fillMedia(streamMedia(appStream, root), stretch);
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
    let playNudge: number | null = null;
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      if (playNudge != null) window.clearInterval(playNudge);
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("canplay", onReady);
      video.removeEventListener("playing", onReady);
      video.removeEventListener("resize", onReady);
      video.removeEventListener("timeupdate", onReady);
      resolve(ok);
    };
    const onReady = () => {
      if (hasPainted()) done(true);
    };
    const timer = window.setTimeout(() => done(hasPainted()), timeoutMs);

    if (typeof video.requestVideoFrameCallback === "function") {
      const onFrame = () => {
        if (video.videoWidth > 2 && video.videoHeight > 2) done(true);
        else if (!settled) video.requestVideoFrameCallback(onFrame);
      };
      video.requestVideoFrameCallback(onFrame);
    }

    video.addEventListener("loadeddata", onReady);
    video.addEventListener("canplay", onReady);
    video.addEventListener("playing", onReady);
    video.addEventListener("resize", onReady);
    video.addEventListener("timeupdate", onReady);
    // Some mobile WebRTC stacks need repeated play() before the first frame.
    playNudge = window.setInterval(() => {
      video.play?.().catch(() => {});
      onReady();
    }, 500);
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
