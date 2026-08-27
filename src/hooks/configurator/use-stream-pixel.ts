/* eslint-disable @typescript-eslint/no-explicit-any */
// /* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  LOADING_CONFIG,
  LOADING_PROGRESS,
  type StreamOverlayKind,
} from "@/lib/configurator/loading-config";
import {
  ensureStreamPixelApplication,
  isStreamPixelSuccess,
  markStreamPixelDisposed,
  streamPixelInitKey,
} from "@/lib/stream-pixel/ensure-application";
import { fitStreamDom, toggleFullscreen, waitForVideoFrame } from "@/lib/stream-pixel/fit-stream";
import {
  AFK_CONFIG,
  STREAM_PIXEL_AFK_TIMEOUT_SECS,
  enableStreamPixelAfk,
} from "@/lib/stream-pixel/afk";

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
  const [streamPhase, setStreamPhase] =
    useState<StreamOverlayKind>("loading");
  const [loadingTitle, setLoadingTitle] = useState<string>(
    LOADING_CONFIG.title,
  );
  const [loadingSubtitle, setLoadingSubtitle] = useState<string>(
    LOADING_CONFIG.subtitle,
  );
  const [loadingStatus, setLoadingStatus] = useState<string>(
    LOADING_CONFIG.statusMessages.initializing,
  );
  const [loadingProgress, setLoadingProgress] = useState<number>(
    LOADING_PROGRESS.initializing,
  );
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const failedRef = useRef(false);
  const revealingRef = useRef(false);
  const [isMuted, setIsMuted] = useState(true);
  const [afkWarning, setAfkWarning] = useState(false);
  const [afkCountdown, setAfkCountdown] = useState(0);
  const dismissAfkRef = useRef<(() => void) | null>(null);
  const resetAfkWatchdogRef = useRef<(() => void) | null>(null);
  const idleTimedOutRef = useRef(false);
  const afkWarningRef = useRef(false);
  const [resolutionEnabled, setResolutionEnabled] = useState(false);

  const safeHideDefaultUi = useCallback((appStream: any) => {
    try {
      const root = appStream?.rootElement as HTMLElement | null | undefined;
      const candidates: Array<HTMLElement | null | undefined> = [
        appStream?.uiFeaturesElement,
        root?.querySelector?.("#uiFeatures"),
        root?.querySelector?.("[id='uiFeatures']"),
        root?.querySelector?.("#connectOverlay"),
        root?.querySelector?.("#playOverlay"),
        root?.querySelector?.("#infoOverlay"),
        root?.querySelector?.("#videoPlayOverlay"),
        root?.querySelector?.("#streamingStateOverlay"),
        root?.querySelector?.("#afkOverlay"),
        typeof document !== "undefined"
          ? (document.getElementById("uiFeatures") as HTMLElement | null)
          : null,
        typeof document !== "undefined"
          ? (document.getElementById("afkOverlay") as HTMLElement | null)
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

  // Keep the bar moving between StreamPixel events so it never sits still.
  useEffect(() => {
    if (!isLoading) return;
    if (
      streamPhase === "disconnected" ||
      streamPhase === "queue" ||
      streamPhase === "idle"
    )
      return;

    const id = window.setInterval(() => {
      setLoadingProgress((p) => {
        if (p >= LOADING_PROGRESS.awaitingVideo) return p;
        const ceiling = Math.min(
          LOADING_PROGRESS.awaitingVideo,
          Math.floor(p / 10) * 10 + 9,
        );
        if (p >= ceiling) return p;
        return Math.min(ceiling, p + 0.45);
      });
    }, 180);

    return () => window.clearInterval(id);
  }, [isLoading, streamPhase]);

  useEffect(() => {
    if (!projectId) return;

    const initConfig = {
      appId: projectId,
      AutoConnect: true as const,
      streamerId: streamerId ?? undefined,
      sfuHost: sfuHost ?? "false",
      sfuPlayer: sfuPlayer ?? "false",
      forceTurn: true as const,
      afktimeout: STREAM_PIXEL_AFK_TIMEOUT_SECS,
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

    const fail = (
      title: string,
      status: string,
      kind: Extract<StreamOverlayKind, "disconnected" | "idle"> = "disconnected",
    ) => {
      if (cancelled || !mountedRef.current) return;
      // AFK timeout is terminal until the user reloads — don't let
      // webRtcDisconnected / reconnectStream replace the inactivity screen.
      if (idleTimedOutRef.current && kind !== "idle") return;
      if (kind === "idle") idleTimedOutRef.current = true;
      failedRef.current = true;
      streamReadyRef.current = false;
      isReconnecting.current = false;
      afkWarningRef.current = false;
      setAfkWarning(false);
      dismissAfkRef.current = null;
      setQueuePosition(null);
      setStreamPhase(kind);
      setIsLoading(true);
      setLoadingTitle(title);
      setLoadingSubtitle(LOADING_CONFIG.disconnectedSubtitle);
      setLoadingStatus(status);
      setLoadingProgress(0);
    };

    const start = async () => {
      failedRef.current = false;
      idleTimedOutRef.current = false;
      isReconnecting.current = false;
      revealingRef.current = false;
      afkWarningRef.current = false;
      setAfkWarning(false);
      dismissAfkRef.current = null;
      setStreamPhase("loading");
      setQueuePosition(null);
      setIsLoading(true);
      setLoadingTitle(LOADING_CONFIG.title);
      setLoadingSubtitle(LOADING_CONFIG.subtitle);
      setLoadingStatus(LOADING_CONFIG.statusMessages.connecting);
      setLoadingProgress(LOADING_PROGRESS.initializing);

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
        enableStreamPixelAfk(
          pixelStreaming,
          appStream,
          STREAM_PIXEL_AFK_TIMEOUT_SECS,
        );

        const findVideoElement = (): HTMLVideoElement | null => {
          const root = appStream.rootElement as HTMLElement | null | undefined;
          const found =
            appStream.stream?.videoElementParent?.querySelector?.("video") ??
            root?.querySelector?.("video") ??
            videoContainerRef.current?.querySelector?.("video");
          return found instanceof HTMLVideoElement ? found : null;
        };

        const revealStream = () => {
          if (cancelled || !mountedRef.current || failedRef.current) return;
          streamReadyRef.current = true;
          setLoadingProgress(LOADING_PROGRESS.ready);
          registerUeListeners(pixelStreaming);
          window.setTimeout(() => {
            if (cancelled || !mountedRef.current || failedRef.current) return;
            setStreamPhase("loading");
            setIsLoading(false);
            setQueuePosition(null);
            setLoadingTitle(LOADING_CONFIG.title);
            setLoadingSubtitle(LOADING_CONFIG.subtitle);
            isReconnecting.current = false;
            revealingRef.current = false;
          }, 700);
        };

        const finishVideoReady = async () => {
          if (cancelled || !mountedRef.current || failedRef.current) return;
          if (revealingRef.current) return;
          revealingRef.current = true;

          try {
            const container = videoContainerRef.current;
            const root = appStream.rootElement;

            if (container && root && root.parentElement !== container) {
              container.appendChild(root);
            }

            safeHideDefaultUi(appStream);
            fitStreamDom(container, appStream, pixelStreaming);
            setLoadingProgress((p) =>
              Math.max(p, LOADING_PROGRESS.awaitingVideo),
            );
            setLoadingStatus(LOADING_CONFIG.statusMessages.playingStream);

            let videoElement = findVideoElement();
            const waitUntil = Date.now() + 12000;
            while (!videoElement && Date.now() < waitUntil) {
              if (cancelled || !mountedRef.current || failedRef.current) return;
              await new Promise((r) => window.setTimeout(r, 120));
              videoElement = findVideoElement();
            }

            if (videoElement) {
              videoElement.muted = true;
              videoElement.autoplay = true;
              videoElement.playsInline = true;
              videoElement.tabIndex = 0;
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

            window.setTimeout(() => {
              if (cancelled || !mountedRef.current) return;
              fitStreamDom(
                videoContainerRef.current,
                appStream,
                pixelStreaming,
              );
            }, 100);

            const painted = await waitForVideoFrame(videoElement, 25000);
            if (cancelled || !mountedRef.current || failedRef.current) return;

            safeHideDefaultUi(appStream);
            enableStreamPixelAfk(
              pixelStreaming,
              appStream,
              STREAM_PIXEL_AFK_TIMEOUT_SECS,
            );
            fitStreamDom(
              videoContainerRef.current,
              appStream,
              pixelStreaming,
            );

            if (!painted) {
              console.warn(
                "[StreamPixel] video element present but no frame yet — revealing anyway",
              );
            }

            revealStream();
          } catch (err) {
            console.error("[StreamPixel] onVideoInitialized error", err);
            revealingRef.current = false;
            setStreamPhase("loading");
            setIsLoading(false);
            streamReadyRef.current = true;
          }
        };

        // ── Reconnect lifecycle ──────────────────────────────────────
        reconnectStream?.on?.("state", (data: { status: string }) => {
          if (cancelled || !mountedRef.current) return;
          if (idleTimedOutRef.current) return;

          switch (data?.status) {
            case "connecting":
            case "reconnecting":
              failedRef.current = false;
              revealingRef.current = false;
              streamReadyRef.current = false;
              isReconnecting.current = true;
              setStreamPhase("loading");
              setQueuePosition(null);
              setIsLoading(true);
              setIsMuted(true);
              setLoadingTitle(LOADING_CONFIG.reconnectingTitle);
              setLoadingSubtitle(LOADING_CONFIG.reconnectingSubtitle);
              setLoadingStatus(LOADING_CONFIG.statusMessages.reconnecting);
              setLoadingProgress(LOADING_PROGRESS.reconnecting);
              break;
            case "retrying":
              failedRef.current = false;
              isReconnecting.current = true;
              setStreamPhase("loading");
              setIsLoading(true);
              setLoadingTitle(LOADING_CONFIG.reconnectingTitle);
              setLoadingSubtitle(LOADING_CONFIG.reconnectingSubtitle);
              setLoadingStatus(LOADING_CONFIG.statusMessages.retrying);
              setLoadingProgress((p) =>
                Math.max(p, LOADING_PROGRESS.retrying),
              );
              break;
            case "connected":
              failedRef.current = false;
              setStreamPhase("loading");
              setIsLoading(true);
              setLoadingTitle(LOADING_CONFIG.reconnectedTitle);
              setLoadingSubtitle(LOADING_CONFIG.subtitle);
              setLoadingStatus(LOADING_CONFIG.statusMessages.reconnected);
              setLoadingProgress((p) =>
                Math.max(p, LOADING_PROGRESS.reconnected),
              );
              break;
            case "disconnected":
              if (!isReconnecting.current) {
                fail(
                  "Disconnected",
                  LOADING_CONFIG.statusMessages.disconnected,
                );
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
          if (cancelled || !mountedRef.current || failedRef.current) return;
          setLoadingStatus(status);
          setLoadingProgress((p) => Math.max(p, pct));
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
          progress(
            LOADING_CONFIG.statusMessages.connecting,
            LOADING_PROGRESS.autoConnect,
          ),
        );
        on("webRtcConnecting", () =>
          progress(
            LOADING_CONFIG.statusMessages.webRtcConnecting,
            LOADING_PROGRESS.webRtcConnecting,
          ),
        );
        on("webRtcSdp", () =>
          progress(
            LOADING_CONFIG.statusMessages.sdpNegotiation,
            LOADING_PROGRESS.sdpNegotiation,
          ),
        );
        on("webRtcConnected", () =>
          progress(
            LOADING_CONFIG.statusMessages.webRtcConnected,
            LOADING_PROGRESS.webRtcConnected,
          ),
        );
        on("streamLoading", () =>
          progress(
            LOADING_CONFIG.statusMessages.streamLoading,
            LOADING_PROGRESS.streamLoading,
          ),
        );
        on("playStream", () =>
          progress(
            LOADING_CONFIG.statusMessages.playingStream,
            LOADING_PROGRESS.playingStream,
          ),
        );

        on("webRtcFailed", () => {
          if (idleTimedOutRef.current) return;
          fail("Connection Failed", LOADING_CONFIG.statusMessages.failed);
        });

        on("webRtcDisconnected", () => {
          streamReadyRef.current = false;
          if (idleTimedOutRef.current) return;
          if (afkWarningRef.current) {
            fail(
              LOADING_CONFIG.idleTitle,
              LOADING_CONFIG.statusMessages.idleTimedOut,
              "idle",
            );
            return;
          }
          if (!isReconnecting.current) {
            fail("Disconnected", LOADING_CONFIG.statusMessages.disconnected);
          }
        });

        on("afkWarningActivate", (e: any) => {
          if (cancelled || !mountedRef.current || failedRef.current) return;
          if (idleTimedOutRef.current) return;
          const n = Number(e?.data?.countDown);
          afkWarningRef.current = true;
          setAfkWarning(true);
          setAfkCountdown(
            Number.isFinite(n) && n > 0 ? n : AFK_CONFIG.countdownSeconds,
          );
          dismissAfkRef.current =
            typeof e?.data?.dismissAfk === "function"
              ? e.data.dismissAfk
              : null;
        });
        on("afkWarningUpdate", (e: any) => {
          if (cancelled || !mountedRef.current || idleTimedOutRef.current) return;
          const n = Number(e?.data?.countDown);
          if (Number.isFinite(n)) setAfkCountdown(n);
        });
        on("afkWarningDeactivate", () => {
          afkWarningRef.current = false;
          setAfkWarning(false);
          dismissAfkRef.current = null;
        });
        on("afkTimedOut", () => {
          fail(
            LOADING_CONFIG.idleTitle,
            LOADING_CONFIG.statusMessages.idleTimedOut,
            "idle",
          );
        });

        // ── Video ready ──────────────────────────────────────────────
        appStream.onVideoInitialized = finishVideoReady;

        appStream.onDisconnect = () => {
          streamReadyRef.current = false;
          if (idleTimedOutRef.current) return;
          if (afkWarningRef.current) {
            fail(
              LOADING_CONFIG.idleTitle,
              LOADING_CONFIG.statusMessages.idleTimedOut,
              "idle",
            );
            return;
          }
          if (!isReconnecting.current) {
            fail("Disconnected", LOADING_CONFIG.statusMessages.disconnected);
          }
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
            if (cancelled || !mountedRef.current || failedRef.current) return;
            if (idleTimedOutRef.current || streamReadyRef.current) return;
            const position = Number(msg?.position);
            if (!Number.isFinite(position) || position <= 0) {
              setQueuePosition(null);
              setStreamPhase("loading");
              return;
            }
            setQueuePosition(position);
            setStreamPhase("queue");
            setIsLoading(true);
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

  const endDueToIdle = useCallback(() => {
    if (idleTimedOutRef.current) return;
    idleTimedOutRef.current = true;
    failedRef.current = true;
    streamReadyRef.current = false;
    isReconnecting.current = false;
    afkWarningRef.current = false;
    setAfkWarning(false);
    dismissAfkRef.current = null;
    setQueuePosition(null);
    setStreamPhase("idle");
    setIsLoading(true);
    setLoadingTitle(LOADING_CONFIG.idleTitle);
    setLoadingSubtitle(LOADING_CONFIG.disconnectedSubtitle);
    setLoadingStatus(LOADING_CONFIG.statusMessages.idleTimedOut);
    setLoadingProgress(0);
    try {
      pixelStreamingRef.current?.disconnect?.();
    } catch {
      /* already gone */
    }
  }, []);

  // Client idle watchdog — Epic's AFK timer never starts if afktimeout is
  // missing, and any data-channel send (UE commands) resets it.
  useEffect(() => {
    if (
      isLoading ||
      streamPhase === "disconnected" ||
      streamPhase === "idle" ||
      streamPhase === "queue"
    ) {
      return;
    }

    const idleMs = AFK_CONFIG.idleSeconds * 1000;
    const countdownSecs = AFK_CONFIG.countdownSeconds;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let tickTimer: ReturnType<typeof setInterval> | null = null;
    let remaining = countdownSecs;
    let warning = false;

    const stopIdle = () => {
      if (idleTimer) {
        clearTimeout(idleTimer);
        idleTimer = null;
      }
    };
    const stopTick = () => {
      if (tickTimer) {
        clearInterval(tickTimer);
        tickTimer = null;
      }
    };

    const startCountdown = () => {
      if (idleTimedOutRef.current || failedRef.current) return;
      warning = true;
      remaining = countdownSecs;
      afkWarningRef.current = true;
      setAfkCountdown(remaining);
      setAfkWarning(true);
      stopTick();
      tickTimer = setInterval(() => {
        remaining -= 1;
        setAfkCountdown(remaining);
        if (remaining <= 0) {
          stopTick();
          stopIdle();
          warning = false;
          endDueToIdle();
        }
      }, 1000);
    };

    const armIdle = () => {
      stopIdle();
      idleTimer = setTimeout(startCountdown, idleMs);
    };

    const onActivity = (event?: Event) => {
      if (idleTimedOutRef.current || failedRef.current) return;
      if (warning && event?.type === "pointermove") return;
      if (warning) {
        warning = false;
        stopTick();
        afkWarningRef.current = false;
        setAfkWarning(false);
        dismissAfkRef.current?.();
      }
      armIdle();
    };

    resetAfkWatchdogRef.current = () => onActivity();

    const opts: AddEventListenerOptions = { capture: true, passive: true };
    const events = [
      "pointerdown",
      "pointermove",
      "keydown",
      "touchstart",
      "wheel",
    ] as const;
    for (const event of events) {
      window.addEventListener(event, onActivity, opts);
    }
    armIdle();
    if (process.env.NODE_ENV !== "production") {
      console.info(
        `[AFK] idle watchdog armed (${AFK_CONFIG.idleSeconds}s, then ${AFK_CONFIG.countdownSeconds}s warning)`,
      );
    }

    return () => {
      resetAfkWatchdogRef.current = null;
      stopIdle();
      stopTick();
      for (const event of events) {
        window.removeEventListener(event, onActivity, opts);
      }
    };
  }, [isLoading, streamPhase, endDueToIdle]);

  const dismissAfk = useCallback(() => {
    dismissAfkRef.current?.();
    resetAfkWatchdogRef.current?.();
  }, []);

  return {
    pixelStreamingRef,
    appStreamRef,
    uiControlRef,
    streamReadyRef,
    isLoading,
    streamPhase,
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
    dismissAfk,
    resolutionEnabled,
  };
}
