/* eslint-disable @typescript-eslint/no-explicit-any */
// /* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LOADING_CONFIG } from "@/lib/configurator/loading-config";
import {
  ensureStreamPixelApplication,
  isStreamPixelSuccess,
  markStreamPixelDisposed,
  streamPixelInitKey,
} from "@/lib/stream-pixel/ensure-application";
import { fitStreamDom, toggleFullscreen } from "@/lib/stream-pixel/fit-stream";

const SHOW_DEV_TOOLS = process.env.NEXT_PUBLIC_SHOW_DEV_TOOLS === "true";

/** Delayed teardown so React Strict Mode remounts can cancel disconnect. */
const TEARDOWN_DELAY_MS = 100;
let teardownTimer: ReturnType<typeof setTimeout> | null = null;
let activeInitKey: string | null = null;

type UseStreamPixelArgs = {
  projectId: string;
  streamerId?: string | null;
  sfuHost?: string | null;
  sfuPlayer?: string | null;
  onUeResponse: (response: unknown) => void;
  videoContainerRef: React.RefObject<HTMLDivElement | null>;
  /** Element to fullscreen (shell with UI chrome). Defaults to video container. */
  fullscreenTargetRef?: React.RefObject<HTMLElement | null>;
};

/**
 * StreamPixel lifecycle for one projectId.
 * Hardened for Next.js: UIControl may be missing, SDK DOM nodes may be null,
 * and Mixpanel / network noise from the SDK is non-fatal.
 */
export function useStreamPixel({
  projectId,
  streamerId,
  sfuHost = "false",
  sfuPlayer = "false",
  onUeResponse,
  videoContainerRef,
  fullscreenTargetRef,
}: UseStreamPixelArgs) {
  const pixelStreamingRef = useRef<any>(null);
  const appStreamRef = useRef<any>(null);
  const uiControlRef = useRef<any>(null);
  const streamReadyRef = useRef(false);
  const isReconnecting = useRef(false);
  const mountedRef = useRef(true);
  const onUeResponseRef = useRef(onUeResponse);
  // eslint-disable-next-line react-hooks/refs
  onUeResponseRef.current = onUeResponse;

  const [isLoading, setIsLoading] = useState(true);
  const [loadingTitle, setLoadingTitle] = useState<string>(
    LOADING_CONFIG.title,
  );
  const [loadingSubtitle, setLoadingSubtitle] = useState<string>(
    LOADING_CONFIG.subtitle,
  );
  const [loadingStatus, setLoadingStatus] = useState<string>(
    LOADING_CONFIG.statusMessages.initializing,
  );
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [afkWarning, setAfkWarning] = useState(false);
  const [afkCountdown, setAfkCountdown] = useState(0);
  const dismissAfkRef = useRef<(() => void) | null>(null);
  const [resolutionEnabled, setResolutionEnabled] = useState(false);

  const safeHideDefaultUi = useCallback((appStream: any) => {
    try {
      const candidates: Array<HTMLElement | null | undefined> = [
        appStream?.uiFeaturesElement,
        appStream?.rootElement?.querySelector?.("#uiFeatures"),
        appStream?.rootElement?.querySelector?.("[id='uiFeatures']"),
        typeof document !== "undefined"
          ? (document.getElementById("uiFeatures") as HTMLElement | null)
          : null,
      ];

      for (const el of candidates) {
        if (el && typeof el === "object" && "style" in el && el.style) {
          el.style.display = "none";
        }
      }
    } catch {
      // SDK chrome hide is best-effort — never break the stream for this
    }
  }, []);

  const registerUeListeners = useCallback((pixelStreaming: any) => {
    if (!pixelStreaming?.addResponseEventListener) return;
    try {
      pixelStreaming.removeResponseEventListener?.("cameraZone");
      pixelStreaming.removeResponseEventListener?.("render");
      pixelStreaming.removeResponseEventListener?.("handle_responses");
      const forward = (response: unknown) => {
        onUeResponseRef.current(response);
      };
      pixelStreaming.addResponseEventListener("cameraZone", forward);
      pixelStreaming.addResponseEventListener("render", forward);
      pixelStreaming.addResponseEventListener("handle_responses", forward);
    } catch (err) {
      console.warn("[CameraZone] listener registration failed", err);
    }
  }, []);

  useEffect(() => {
    if (!projectId) return;

    const initConfig = {
      appId: projectId,
      AutoConnect: true as const,
      streamerId: streamerId ?? undefined,
      sfuHost: sfuHost ?? "false",
      sfuPlayer: sfuPlayer ?? "false",
      forceTurn: true as const,
    };
    const initKey = streamPixelInitKey(initConfig);
    activeInitKey = initKey;

    // Cancel a pending Strict Mode teardown so we keep the live session
    if (teardownTimer) {
      clearTimeout(teardownTimer);
      teardownTimer = null;
    }

    mountedRef.current = true;
    let cancelled = false;

    const fail = (title: string, status: string) => {
      if (cancelled || !mountedRef.current) return;
      setIsLoading(true);
      setLoadingTitle(title);
      setLoadingSubtitle(LOADING_CONFIG.disconnectedSubtitle);
      setLoadingStatus(status);
      setLoadingProgress(0);
    };

    const start = async () => {
      setIsLoading(true);
      setLoadingTitle(LOADING_CONFIG.title);
      setLoadingSubtitle(LOADING_CONFIG.subtitle);
      setLoadingStatus(LOADING_CONFIG.statusMessages.connecting);
      setLoadingProgress(10);

      try {
        const result = await ensureStreamPixelApplication(initConfig);

        if (cancelled || !mountedRef.current) return;

        if (!isStreamPixelSuccess(result)) {
          if (result == null) {
            console.error(
              "[StreamPixel] Init returned null — check appId, network, or domain whitelist",
              result,
            );
          } else if (Array.isArray(result)) {
            console.error(
              "[StreamPixel] Unsupported browser / codec capabilities",
              result,
            );
          } else {
            console.error(
              "[StreamPixel] Missing appStream/pixelStreaming (SDK already initialized or reload required)",
              result,
            );
          }
          fail("Connection Failed", LOADING_CONFIG.statusMessages.failed);
          return;
        }

        const {
          appStream,
          pixelStreaming,
          queueHandler,
          UIControl,
          reconnectStream,
        } = result;

        pixelStreamingRef.current = pixelStreaming;
        appStreamRef.current = appStream;
        uiControlRef.current = UIControl ?? null;

        if (SHOW_DEV_TOOLS && typeof window !== "undefined") {
          (window as any).pixelStreaming = pixelStreaming;
          (window as any).appStream = appStream;
        }

        registerUeListeners(pixelStreaming);

        // UIControl is not always present — guard the whole object
        try {
          if (UIControl?.getResolution?.()) {
            setResolutionEnabled(true);
          }
        } catch {
          setResolutionEnabled(false);
        }

        safeHideDefaultUi(appStream);

        const finishVideoReady = () => {
          if (cancelled || !mountedRef.current) return;

          try {
            streamReadyRef.current = true;

            const container = videoContainerRef.current;
            const root = appStream.rootElement;

            // Mount only if not already under our container
            if (container && root) {
              if (root.parentElement !== container) {
                container.appendChild(root);
              }
            }

            safeHideDefaultUi(appStream);
            fitStreamDom(container, appStream, pixelStreaming);

            // Prefer optional chaining — SDK video tree can lag one frame
            const videoElement =
              appStream.stream?.videoElementParent?.querySelector?.("video") ??
              root?.querySelector?.("video");

            if (videoElement) {
              videoElement.muted = true;
              videoElement.autoplay = true;
              videoElement.playsInline = true;
              videoElement.tabIndex = 0;
              // play() can reject without a user gesture — ignore
              videoElement.play?.().catch(() => {});
              try {
                videoElement.focus?.();
              } catch {
                /* ignore */
              }
            }

            const audioEl =
              appStream.stream?._webRtcController?.streamController
                ?.audioElement;
            if (audioEl) audioEl.muted = true;

            // Refit after layout / decoder settle
            window.setTimeout(() => {
              if (cancelled || !mountedRef.current) return;
              fitStreamDom(
                videoContainerRef.current,
                appStream,
                pixelStreaming,
              );
            }, 100);
            window.setTimeout(() => {
              if (cancelled || !mountedRef.current) return;
              fitStreamDom(
                videoContainerRef.current,
                appStream,
                pixelStreaming,
              );
            }, 500);

            setLoadingProgress(100);
            registerUeListeners(pixelStreaming);

            window.setTimeout(() => {
              if (cancelled || !mountedRef.current) return;
              setIsLoading(false);
              setQueuePosition(null);
              setLoadingTitle(LOADING_CONFIG.title);
              setLoadingSubtitle(LOADING_CONFIG.subtitle);
              isReconnecting.current = false;
            }, 300);
          } catch (err) {
            console.error("[StreamPixel] onVideoInitialized error", err);
            // Stream may still be usable — don't hard-fail
            setIsLoading(false);
            streamReadyRef.current = true;
          }
        };

        // ── Reconnect lifecycle ──────────────────────────────────────
        reconnectStream?.on?.("state", (data: { status: string }) => {
          if (cancelled || !mountedRef.current) return;

          switch (data?.status) {
            case "connecting":
            case "reconnecting":
              streamReadyRef.current = false;
              setIsLoading(true);
              setIsMuted(true);
              setLoadingTitle(LOADING_CONFIG.reconnectingTitle);
              setLoadingSubtitle(LOADING_CONFIG.reconnectingSubtitle);
              setLoadingStatus(LOADING_CONFIG.statusMessages.reconnecting);
              setLoadingProgress(20);
              isReconnecting.current = true;
              break;
            case "connected":
              setLoadingTitle(LOADING_CONFIG.reconnectedTitle);
              setLoadingSubtitle(LOADING_CONFIG.subtitle);
              setLoadingStatus(LOADING_CONFIG.statusMessages.reconnected);
              setLoadingProgress(70);
              break;
            case "disconnected":
              setIsLoading(true);
              if (!isReconnecting.current) {
                setLoadingTitle("Disconnected");
                setLoadingSubtitle(LOADING_CONFIG.disconnectedSubtitle);
                setLoadingStatus(LOADING_CONFIG.statusMessages.disconnected);
                setLoadingProgress(0);
              }
              break;
            case "failed":
              fail(
                LOADING_CONFIG.reconnectFailedTitle,
                LOADING_CONFIG.statusMessages.reconnectFailed,
              );
              break;
            default:
              break;
          }
        });

        const progress = (status: string, pct: number) => {
          if (cancelled || !mountedRef.current) return;
          setLoadingStatus(status);
          setLoadingProgress(pct);
        };

        const on = (event: string, handler: (e?: any) => void) => {
          try {
            pixelStreaming.addEventListener?.(event, handler);
          } catch (err) {
            console.warn(
              `[StreamPixel] addEventListener(${event}) failed`,
              err,
            );
          }
        };

        on("webRtcAutoConnect", () =>
          progress(LOADING_CONFIG.statusMessages.connecting, 15),
        );
        on("webRtcConnecting", () =>
          progress(LOADING_CONFIG.statusMessages.webRtcConnecting, 30),
        );
        on("webRtcSdp", () =>
          progress(LOADING_CONFIG.statusMessages.sdpNegotiation, 50),
        );
        on("webRtcConnected", () =>
          progress(LOADING_CONFIG.statusMessages.webRtcConnected, 70),
        );
        on("streamLoading", () =>
          progress(LOADING_CONFIG.statusMessages.streamLoading, 80),
        );
        on("playStream", () =>
          progress(LOADING_CONFIG.statusMessages.playingStream, 90),
        );

        on("webRtcFailed", () => {
          fail("Connection Failed", LOADING_CONFIG.statusMessages.failed);
        });

        on("webRtcDisconnected", () => {
          streamReadyRef.current = false;
          if (!isReconnecting.current) {
            fail("Disconnected", LOADING_CONFIG.statusMessages.disconnected);
          }
        });

        on("afkWarningActivate", (e: any) => {
          setAfkWarning(true);
          setAfkCountdown(e?.data?.countDown ?? 0);
          dismissAfkRef.current = e?.data?.dismissAfk ?? null;
        });
        on("afkWarningUpdate", (e: any) => {
          setAfkCountdown(e?.data?.countDown ?? 0);
        });
        on("afkWarningDeactivate", () => {
          setAfkWarning(false);
          dismissAfkRef.current = null;
        });
        on("afkTimedOut", () => {
          setAfkWarning(false);
          dismissAfkRef.current = null;
          fail("Session Ended", "You were disconnected due to inactivity.");
        });

        // ── Video ready ──────────────────────────────────────────────
        appStream.onVideoInitialized = finishVideoReady;

        appStream.onDisconnect = () => {
          streamReadyRef.current = false;
        };

        // Cached reuse: video may already be initialized — remount now
        const root = appStream.rootElement;
        const existingVideo =
          appStream.stream?.videoElementParent?.querySelector?.("video") ??
          root?.querySelector?.("video");
        if (existingVideo) {
          finishVideoReady();
        }

        // Queue updates (optional API)
        try {
          queueHandler?.((msg: { position: number }) => {
            if (cancelled || !mountedRef.current) return;
            setQueuePosition(msg.position);
            setLoadingStatus(LOADING_CONFIG.statusMessages.inQueue);
          });
        } catch (err) {
          console.warn("[StreamPixel] queueHandler failed", err);
        }
      } catch (err) {
        console.error("[StreamPixel] init failed", err);
        fail("Connection Failed", LOADING_CONFIG.statusMessages.failed);
      }
    };

    start();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      streamReadyRef.current = false;

      try {
        pixelStreamingRef.current?.removeResponseEventListener?.("cameraZone");
        pixelStreamingRef.current?.removeResponseEventListener?.("render");
        pixelStreamingRef.current?.removeResponseEventListener?.(
          "handle_responses",
        );
      } catch {
        /* ignore */
      }

      const pixelStreaming = pixelStreamingRef.current;

      pixelStreamingRef.current = null;
      appStreamRef.current = null;
      uiControlRef.current = null;

      if (SHOW_DEV_TOOLS && typeof window !== "undefined") {
        delete (window as any).pixelStreaming;
        delete (window as any).appStream;
      }

      // Delay disconnect so Strict Mode remount can cancel and reuse the session
      if (teardownTimer) clearTimeout(teardownTimer);
      const keyAtCleanup = initKey;
      teardownTimer = setTimeout(() => {
        teardownTimer = null;
        // Remount with same key cancelled this; different key / real leave proceeds
        if (activeInitKey === keyAtCleanup && mountedRef.current) return;

        try {
          pixelStreaming?.disconnect?.();
        } catch {
          /* ignore */
        }
        markStreamPixelDisposed();
      }, TEARDOWN_DELAY_MS);
    };
  }, [
    projectId,
    streamerId,
    sfuHost,
    sfuPlayer,
    registerUeListeners,
    safeHideDefaultUi,
    videoContainerRef,
  ]);

  const toggleMute = useCallback(() => {
    const appStream = appStreamRef.current;
    const root = appStream?.rootElement;
    const video =
      appStream?.stream?.videoElementParent?.querySelector?.("video") ??
      root?.querySelector?.("video");
    const audio =
      appStream?.stream?._webRtcController?.streamController?.audioElement;

    const next = !isMuted;
    if (video) video.muted = next;
    // eslint-disable-next-line react-hooks/immutability
    if (audio) audio.muted = next;
    setIsMuted(next);
  }, [isMuted]);

  const refit = useCallback(() => {
    fitStreamDom(
      videoContainerRef.current,
      appStreamRef.current,
      pixelStreamingRef.current,
    );
  }, [videoContainerRef]);

  // Keep stream filling the viewport on resize / fullscreen toggles
  useEffect(() => {
    const onResize = () => refit();
    const onFs = () => {
      window.setTimeout(refit, 50);
      window.setTimeout(refit, 250);
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("webkitfullscreenchange", onFs as EventListener);
    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener(
        "webkitfullscreenchange",
        onFs as EventListener,
      );
    };
  }, [refit]);

  const requestFullscreen = useCallback(() => {
    // Prefer the shell (controls stay visible); fall back to stream viewport
    const container = fullscreenTargetRef?.current ?? videoContainerRef.current;
    const appStream = appStreamRef.current;
    const video =
      (appStream?.stream?.videoElementParent?.querySelector?.(
        "video",
      ) as HTMLVideoElement | null) ??
      (appStream?.rootElement?.querySelector?.(
        "video",
      ) as HTMLVideoElement | null);

    void toggleFullscreen(container, video).then(() => {
      window.setTimeout(refit, 50);
      window.setTimeout(refit, 250);
    });
  }, [refit, videoContainerRef, fullscreenTargetRef]);

  return {
    pixelStreamingRef,
    appStreamRef,
    uiControlRef,
    streamReadyRef,
    isLoading,
    loadingTitle,
    loadingSubtitle,
    loadingStatus,
    loadingProgress,
    queuePosition,
    isMuted,
    toggleMute,
    requestFullscreen,
    afkWarning,
    afkCountdown,
    dismissAfk: () => dismissAfkRef.current?.(),
    resolutionEnabled,
  };
}
