/**
 * Capture one Pixel Streaming video frame into a 1920×1080 JPEG.
 * Uses object-fit: contain (letterbox) so mobile/tablet/desktop are not cropped.
 * WebRTC srcObject frames are same-origin — canvas is not tainted.
 */

export const STILL_WIDTH = 1920;
export const STILL_HEIGHT = 1080;

export function findStreamVideo(
  container?: HTMLElement | null,
): HTMLVideoElement | null {
  const scoped =
    container?.querySelector?.("video") ??
    (typeof document !== "undefined"
      ? document.querySelector(".stream-viewport video")
      : null);
  if (scoped instanceof HTMLVideoElement) return scoped;
  if (typeof document === "undefined") return null;
  const any = document.querySelector("video");
  return any instanceof HTMLVideoElement ? any : null;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/** Wait until the decoder has painted at least one new frame. */
export function waitForVideoFrame(
  video: HTMLVideoElement,
  timeoutMs = 1800,
): Promise<boolean> {
  if (video.readyState >= 2 && video.videoWidth > 0) {
    const rvfc = (
      video as HTMLVideoElement & {
        requestVideoFrameCallback?: (cb: () => void) => number;
      }
    ).requestVideoFrameCallback;
    if (typeof rvfc === "function") {
      return new Promise((resolve) => {
        let done = false;
        const t = window.setTimeout(() => {
          if (done) return;
          done = true;
          resolve(video.videoWidth > 0);
        }, timeoutMs);
        rvfc.call(video, () => {
          if (done) return;
          done = true;
          window.clearTimeout(t);
          resolve(true);
        });
      });
    }
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const onReady = () => {
      cleanup();
      resolve(video.videoWidth > 0);
    };
    const cleanup = () => {
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("playing", onReady);
      window.clearTimeout(timer);
    };
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("playing", onReady);
    const timer = window.setTimeout(() => {
      cleanup();
      resolve(video.videoWidth > 0);
    }, timeoutMs);
  });
}

/**
 * Draw the video into a 16:9 1080p canvas without cropping.
 * Returns a blob: URL (caller must revoke) or null.
 */
export async function captureVideoStill(
  container?: HTMLElement | null,
  width = STILL_WIDTH,
  height = STILL_HEIGHT,
): Promise<string | null> {
  const video = findStreamVideo(container);
  if (!video || video.readyState < 2 || video.videoWidth < 2) {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#071c20";
  ctx.fillRect(0, 0, width, height);

  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const scale = Math.min(width / vw, height / vh);
  const dw = vw * scale;
  const dh = vh * scale;
  const dx = (width - dw) / 2;
  const dy = (height - dh) / 2;

  try {
    ctx.drawImage(video, dx, dy, dw, dh);
  } catch (err) {
    console.warn("[FinalDesign] video draw failed (tainted?)", err);
    return null;
  }

  return new Promise((resolve) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          resolve(URL.createObjectURL(blob));
        },
        "image/jpeg",
        0.86,
      );
    } catch (err) {
      console.warn("[FinalDesign] toBlob failed", err);
      resolve(null);
    }
  });
}
