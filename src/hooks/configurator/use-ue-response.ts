"use client";

import { useCallback, useRef } from "react";
import {
  extractCustomizationEvent,
  extractUeCommandAck,
  parseUeResponse,
} from "@/lib/stream-pixel/parse-ue-response";
import { logUeResponse } from "@/lib/stream-pixel/ue-logger";
import {
  noteCustomizationResult,
  noteUeAck,
  noteUeLoadId,
} from "@/lib/configurator/ue-load-id";

/**
 * Stable StreamPixel `onUeResponse`: logs (deduped), records command acks for
 * awaiting senders, then forwards the raw response to `onEventRef.current`.
 */
export function useUeResponse(
  onEventRef: React.RefObject<(response: unknown) => void>,
) {
  const lastKeyRef = useRef("");
  const lastAtRef = useRef(0);

  return useCallback(
    (response: unknown) => {
      let parsed: unknown = response;
      try {
        parsed = parseUeResponse(response);
      } catch {
        parsed = response;
      }
      const key = JSON.stringify(parsed);
      const now = Date.now();
      if (key !== lastKeyRef.current || now - lastAtRef.current > 200) {
        lastKeyRef.current = key;
        lastAtRef.current = now;
        console.info("[UE response]", parsed);
        logUeResponse(parsed);
      }

      const custom = extractCustomizationEvent(response);
      const ack = extractUeCommandAck(response);
      if (ack) {
        noteUeAck(ack);
      } else if (custom?.kind === "saved") {
        noteUeAck({
          type: "SaveCustomization",
          ok: true,
          status: "success",
          code: 200,
        });
      } else if (custom?.kind === "error" && custom.op === "save") {
        noteUeAck({
          type: "SaveCustomization",
          ok: false,
          status: "failed",
          code: 404,
        });
      }

      if (
        custom?.kind === "loaded" ||
        (custom?.kind === "error" && custom.op !== "save")
      ) {
        noteCustomizationResult(custom.kind);
      }
      if (custom?.loadId) noteUeLoadId(custom.loadId);
      onEventRef.current?.(response);
    },
    [onEventRef],
  );
}
