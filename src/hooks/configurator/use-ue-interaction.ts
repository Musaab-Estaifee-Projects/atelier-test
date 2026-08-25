"use client";

import { UeInteractionPayload } from "@/lib/stream-pixel/ue-protocol";
import { useCallback, useRef } from "react";

type PixelStreamingLike = {
  emitUIInteraction?: (payload: Record<string, unknown>) => boolean | void;
};

/**
 * Safe wrapper around emitUIInteraction.
 * - Never exposes raw emit to production UI
 * - Coerces numeric Index fields (UE is picky about types)
 * - No-ops until stream is ready
 * - Honors false return from Pixel Streaming (video not ready)
 */
export function useUeInteraction(
  pixelStreamingRef: React.RefObject<PixelStreamingLike | null>,
  streamReadyRef: React.RefObject<boolean>,
) {
  const lastWarnAtRef = useRef(0);

  const normalize = useCallback((payload: UeInteractionPayload) => {
    const data = { ...payload } as Record<string, unknown>;
    for (const key of ["Index", "index", "CameraIndex", "cameraIndex"]) {
      const v = data[key];
      if (typeof v === "string" && /^\d+$/.test(v)) data[key] = Number(v);
    }
    return data;
  }, []);

  const warnThrottled = useCallback((message: string) => {
    const now = Date.now();
    if (now - lastWarnAtRef.current < 2000) return;
    lastWarnAtRef.current = now;
    console.warn(message);
  }, []);

  const sendUEInteraction = useCallback(
    (payload: UeInteractionPayload): boolean => {
      const ps = pixelStreamingRef.current;
      const fn = (payload as { Function?: string }).Function;
      const isProbe = fn === "ConfiguratorReadyProbe";

      if (!ps?.emitUIInteraction) {
        if (!isProbe) warnThrottled("[UE] emitUIInteraction unavailable");
        return false;
      }
      if (!streamReadyRef.current) {
        if (!isProbe)
          warnThrottled("[UE] Stream not ready; interaction ignored");
        return false;
      }
      try {
        const result = ps.emitUIInteraction(normalize(payload));
        if (result === false) {
          if (!isProbe) {
            warnThrottled("[UE] emitUIInteraction rejected (video not ready)");
          }
          return false;
        }
        return true;
      } catch (err) {
        console.error("[UE] emitUIInteraction failed", err);
        return false;
      }
    },
    [normalize, pixelStreamingRef, streamReadyRef, warnThrottled],
  );

  return { sendUEInteraction };
}
