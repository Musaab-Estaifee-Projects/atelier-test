"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiErrorMessage } from "@/lib/api-error";
import { newIdempotencyKey } from "@/lib/configurator/storage";
import {
  roomsFromRenders,
  stillIndexFor,
  stillsFromRenders,
} from "@/lib/configurator/renders-view";
import { cloneQuotationDesign } from "@/lib/quotation/clone-design";
import { clearQuotationResume } from "@/lib/quotation/resume-intent";
import {
  confirmDesign,
  type ConfirmDesignData,
} from "@/services/confirm-design.service";
import {
  getRenders,
  parseRenderTotalAmount,
  prepareRenders,
  type GetRendersData,
} from "@/services/renders.service";
import type { DesignSummaryData } from "@/services/post-design-summary.service";
import type { SavedDesignData } from "@/services/get-saved-design.service";
import type { StoredSelection } from "@/types/stored-selection";

const POLL_MS = 3000;

export type KeepQuotationPhase = "review" | "renders" | "ready";

/**
 * Expired-quotation "Keep my customization": clone with keep_customizations=1,
 * POST summary, prepare renders, poll, then confirm. No local draft, no stream.
 */
export function useKeepQuotation(source: SavedDesignData, enabled: boolean) {
  const [bootError, setBootError] = useState<string | null>(null);
  const [designCode, setDesignCode] = useState<string | null>(null);
  const [summary, setSummary] = useState<DesignSummaryData | null>(null);
  const [prepareSelections, setPrepareSelections] = useState<StoredSelection[]>(
    [],
  );
  const [phase, setPhase] = useState<KeepQuotationPhase>("review");
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<ConfirmDesignData | null>(null);
  const [renders, setRenders] = useState<GetRendersData | null>(null);
  const [rendersError, setRendersError] = useState<string | null>(null);
  const [rendersPending, setRendersPending] = useState(false);
  const [rendersNotReadyOpen, setRendersNotReadyOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const cloneOnceRef = useRef(false);
  const confirmInFlightRef = useRef(false);
  const prepareInFlightRef = useRef(false);
  const prepareKeyRef = useRef<{ code: string; key: string } | null>(null);
  const pollRef = useRef<number | null>(null);
  const phaseRef = useRef(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (!enabled || cloneOnceRef.current) return;
    cloneOnceRef.current = true;
    clearQuotationResume();

    const streamId = source.property.project.streampixel_app_id?.trim();
    const projectId = String(source.property.project.id);
    const apartmentId =
      source.property.apartment?.id != null
        ? String(source.property.apartment.id)
        : null;

    void (async () => {
      const cloned = await cloneQuotationDesign({
        sourceDesignCode: source.design_code,
        streamProjectId: streamId || projectId,
        backendProjectId: projectId,
        layoutCode: source.property.layout.code,
        apartmentId,
        keepCustomizations: true,
        persistLocalSelections: false,
        postSummary: true,
      });
      if (!cloned.ok) {
        setBootError(cloned.message);
        return;
      }
      if (!cloned.summary) {
        setBootError("Could not load the quotation summary. Please try again.");
        return;
      }
      setDesignCode(cloned.designCode);
      setSummary(cloned.summary);
      setPrepareSelections(cloned.allSelections);
    })();
  }, [enabled, source]);

  const stopPoll = useCallback(() => {
    if (pollRef.current != null) {
      window.clearTimeout(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const pollNextRef = useRef<(code: string) => void>(() => undefined);

  const pollRenders = useCallback(
    async (code: string) => {
      try {
        const next = await getRenders(code);
        if (phaseRef.current !== "renders") return;
        setRenders(next);
        setRendersError(null);
        if (next.is_all_rendered || next.is_terminal) {
          stopPoll();
          return;
        }
        pollNextRef.current(code);
      } catch (err) {
        if (phaseRef.current !== "renders") return;
        setRendersError(apiErrorMessage(err, "Failed to load render progress"));
        pollNextRef.current(code);
      }
    },
    [stopPoll],
  );

  useEffect(() => {
    pollNextRef.current = (code: string) => {
      stopPoll();
      pollRef.current = window.setTimeout(() => {
        void pollRenders(code);
      }, POLL_MS);
    };
  }, [pollRenders, stopPoll]);

  useEffect(() => () => stopPoll(), [stopPoll]);

  const summaryReady = Boolean(designCode && summary);

  const startRenders = useCallback(async () => {
    if (prepareInFlightRef.current) return;
    const code = designCode?.trim();
    const summaryToken = summary?.summary_token?.trim();
    if (!code) {
      setRendersError("Design is not ready yet.");
      return;
    }
    if (!summaryToken) {
      setRendersError("Quotation summary is not ready yet.");
      return;
    }
    if (!prepareSelections.length) {
      setRendersError("Saved choices for this design could not be found.");
      return;
    }

    if (prepareKeyRef.current?.code !== code) {
      prepareKeyRef.current = { code, key: newIdempotencyKey() };
    }

    prepareInFlightRef.current = true;
    setRendersPending(true);
    setRendersError(null);
    try {
      await prepareRenders(
        code,
        {
          selection_revision: 0,
          summary_token: summaryToken,
          selections: prepareSelections,
        },
        prepareKeyRef.current.key,
      );
      setPhase("renders");
      phaseRef.current = "renders";
      await pollRenders(code);
    } catch (err) {
      setRendersError(apiErrorMessage(err, "Failed to prepare renders"));
    } finally {
      prepareInFlightRef.current = false;
      setRendersPending(false);
    }
  }, [designCode, pollRenders, prepareSelections, summary?.summary_token]);

  const rooms = useMemo(() => roomsFromRenders(renders), [renders]);
  const stills = useMemo(() => stillsFromRenders(renders), [renders]);

  const openViewer = useCallback(
    (zoneId: string, cameraName?: string) => {
      const index = stillIndexFor(stills, zoneId, cameraName);
      if (index >= 0) setLightboxIndex(index);
    },
    [stills],
  );

  const confirm = useCallback(async () => {
    if (confirmInFlightRef.current) return;
    if (!renders?.is_all_rendered) {
      setRendersNotReadyOpen(true);
      return;
    }
    const code = designCode?.trim();
    if (!code) {
      setConfirmError("Missing design code. Please try again.");
      return;
    }
    confirmInFlightRef.current = true;
    setConfirming(true);
    setConfirmError(null);
    try {
      const result = await confirmDesign(code);
      if (!result.ok) {
        confirmInFlightRef.current = false;
        setConfirmError(result.message);
        return;
      }
      stopPoll();
      setConfirmed(result.data);
      setDesignCode(result.data.design_code);
      setPhase("ready");
    } finally {
      setConfirming(false);
    }
  }, [designCode, renders?.is_all_rendered, stopPoll]);

  return {
    bootError,
    designCode,
    summary,
    summaryReady,
    phase,
    renders,
    rooms,
    stills,
    totalAmount: parseRenderTotalAmount(renders?.total_amount),
    rendersError,
    rendersPending,
    rendersNotReadyOpen,
    closeRendersNotReady: () => setRendersNotReadyOpen(false),
    lightboxIndex,
    setLightboxIndex,
    openViewer,
    confirming,
    confirmError,
    confirmed,
    startRenders,
    confirm,
  };
}
