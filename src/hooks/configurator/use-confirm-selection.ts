"use client";

import { useCallback, useRef, useState } from "react";
import { clearDraft } from "@/lib/configurator/storage";
import {
  confirmDesign,
  type ConfirmDesignData,
} from "@/services/confirm-design.service";
import type { ShareableConfiguratorParams } from "@/types/configurator";

type Args = {
  allReady: boolean;
  stopRenders: () => void;
  designCode: string | null;
  designCodeRef: React.RefObject<string | null>;
  setDesignCode: (code: string) => void;
  storage: {
    streamProjectId: string;
    projectId: string;
    layoutCode: string;
    apartmentId: string | null;
  };
  setParams: (
    patch: Partial<ShareableConfiguratorParams>,
    options?: { replace?: boolean },
  ) => void;
};

/** "Confirm My Selection" on the renders screen → POST confirm → QuotationReady. */
export function useConfirmSelection({
  allReady,
  stopRenders,
  designCode,
  designCodeRef,
  setDesignCode,
  storage,
  setParams,
}: Args) {
  const [quotationReady, setQuotationReady] = useState(false);
  const [confirmedQuote, setConfirmedQuote] =
    useState<ConfirmDesignData | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rendersNotReadyOpen, setRendersNotReadyOpen] = useState(false);
  const inFlightRef = useRef(false);

  const confirm = useCallback(async () => {
    if (inFlightRef.current) return;
    if (!allReady) {
      setRendersNotReadyOpen(true);
      return;
    }
    const code = (designCodeRef.current ?? designCode ?? "").trim();
    if (!code) {
      setError("Missing design code. Please try again.");
      return;
    }

    inFlightRef.current = true;
    setPending(true);
    setError(null);
    try {
      const result = await confirmDesign(code);
      if (!result.ok) {
        setError(result.message);
        return;
      }

      setConfirmedQuote(result.data);
      setDesignCode(result.data.design_code);
      clearDraft(
        storage.streamProjectId,
        storage.projectId,
        storage.layoutCode,
        storage.apartmentId,
      );
      stopRenders();
      setParams({ renders: false }, { replace: true });
      setQuotationReady(true);
    } finally {
      inFlightRef.current = false;
      setPending(false);
    }
  }, [
    allReady,
    designCode,
    designCodeRef,
    setDesignCode,
    setParams,
    stopRenders,
    storage,
  ]);

  const reset = useCallback(() => {
    setConfirmedQuote(null);
    setQuotationReady(false);
  }, []);

  return {
    quotationReady,
    confirmedQuote,
    pending,
    error,
    rendersNotReadyOpen,
    closeRendersNotReady: () => setRendersNotReadyOpen(false),
    confirm,
    reset,
  };
}
