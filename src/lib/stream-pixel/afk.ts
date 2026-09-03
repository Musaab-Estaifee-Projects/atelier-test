/**
 * AFK idle timeout for StreamPixel Web SDK sessions.
 *
 * Epic's AFKController only arms when AFKTimeout > 0. StreamPixel sets that
 * from `settings.afktimeout ?? projectData.afktimeout` — if both are missing
 * the timer never starts. We always pass a timeout, and also run a client
 * watchdog because data-channel sends (UE messages) reset Epic's timer.
 *
 * @see https://docs.streampixel.io/resources/web-sdk/features/afk-idle-timeout
 */

function readIdleSeconds(): number {
  const raw = Number(process.env.NEXT_PUBLIC_STREAM_AFK_TIMEOUT);
  if (Number.isFinite(raw) && raw >= 1) {
    return Math.min(7200, Math.floor(raw));
  }
  return 120;
}

export const AFK_CONFIG = {
  /** Seconds with no pointer/keyboard/touch before the warning. */
  idleSeconds: readIdleSeconds(),
  /** Warning countdown before we disconnect. */
  countdownSeconds: 60,
} as const;

/** Seconds passed to StreamPixel so its AFK controller actually arms. */
export const STREAM_PIXEL_AFK_TIMEOUT_SECS =
  AFK_CONFIG.idleSeconds + AFK_CONFIG.countdownSeconds;

/* eslint-disable @typescript-eslint/no-explicit-any */
export function enableStreamPixelAfk(
  pixelStreaming: any,
  appStream: any,
  timeoutSecs: number,
): void {
  const controller =
    appStream?.stream?._webRtcController ?? pixelStreaming?._webRtcController;
  const config = controller?.config ?? pixelStreaming?.config;

  try {
    config?.setNumericSetting?.("AFKTimeout", timeoutSecs);
    config?.setFlagEnabled?.("TimeoutIfIdle", true);
  } catch {
    /* settings API is best-effort */
  }

  try {
    controller?.setAfkEnabled?.(true);
    controller?.afkController?.startAfkWarningTimer?.();
  } catch {
    /* AFK controller is best-effort */
  }
}
