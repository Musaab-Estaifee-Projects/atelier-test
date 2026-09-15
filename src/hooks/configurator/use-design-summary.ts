"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildApiSelections } from "@/lib/configurator/api-selections";
import { isDesignFrozenError } from "@/lib/configurator/is-design-frozen";
import { patchDraft } from "@/lib/configurator/storage";
import { postDesignSummary } from "@/services/post-design-summary.service";
import type { DesignSummaryData } from "@/services/post-design-summary.service";
import type {
  ConfiguratorSession,
  SelectionMap,
} from "@/types/configurator";
import type { StoredSelection } from "@/types/stored-selection";

type Args = {
  enabled: boolean;
  streamProjectId: string;
  backendProjectId: string;
  layoutCode: string;
  apartmentId?: string | null;
  designCode: string | null;
  session: ConfiguratorSession | null;
  customMap: SelectionMap;
  onFrozen?: () => void;
};

export function useDesignSummary({
  enabled,
  streamProjectId,
  backendProjectId,
  layoutCode,
  apartmentId,
  designCode,
  session,
  customMap,
  onFrozen,
}: Args) {
  const [data, setData] = useState<DesignSummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seqRef = useRef(0);
  const frozenRef = useRef(false);
  const onFrozenRef = useRef(onFrozen);
  onFrozenRef.current = onFrozen;
  const payloadRef = useRef<StoredSelection[]>([]);

  const payload = useMemo(() => {
    if (!session) return [];
    return buildApiSelections(session, customMap);
  }, [session, customMap]);
  payloadRef.current = payload;

  useEffect(() => {
    frozenRef.current = false;
  }, [designCode]);

  const refresh = useCallback(async () => {
    if (!designCode || !session || !backendProjectId) return null;
    if (frozenRef.current) return null;
    const seq = ++seqRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await postDesignSummary(designCode, {
        selection_revision: 0,
        selections: payloadRef.current,
      });
      if (seq !== seqRef.current) return result;
      patchDraft(
        {
          streamProjectId,
          projectId: backendProjectId,
          layoutCode: session.layoutCode || layoutCode,
          apartmentId,
        },
        {
          summaryToken: result.summary_token,
          summaryExpiresAt: result.summary_expires_at,
        },
      );
      setData(result);
      return result;
    } catch (err) {
      if (seq !== seqRef.current) return null;
      if (isDesignFrozenError(err)) {
        frozenRef.current = true;
        onFrozenRef.current?.();
        setError(null);
        return null;
      }
      const message =
        err instanceof Error ? err.message : "Failed to load quotation summary";
      setError(message);
      return null;
    } finally {
      if (seq === seqRef.current) setLoading(false);
    }
  }, [
    apartmentId,
    backendProjectId,
    designCode,
    layoutCode,
    session,
    streamProjectId,
  ]);

  useEffect(() => {
    if (!enabled || !designCode || !session || frozenRef.current) return;
    const timer = window.setTimeout(() => {
      void refresh();
    }, 400);
    return () => window.clearTimeout(timer);
  }, [enabled, designCode, session, payload, refresh]);

  return { data, loading, error, payload, refresh };
}
