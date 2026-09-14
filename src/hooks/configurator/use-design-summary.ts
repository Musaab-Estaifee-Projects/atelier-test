"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildApiSelections } from "@/lib/configurator/api-selections";
import { loadDraft, saveDraft } from "@/lib/configurator/storage";
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
}: Args) {
  const [data, setData] = useState<DesignSummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seqRef = useRef(0);
  const payloadRef = useRef<StoredSelection[]>([]);

  const payload = useMemo(() => {
    if (!session) return [];
    return buildApiSelections(session, customMap);
  }, [session, customMap]);
  payloadRef.current = payload;

  const refresh = useCallback(async () => {
    if (!designCode || !session || !backendProjectId) return null;
    const seq = ++seqRef.current;
    setLoading(true);
    setError(null);
    try {
      const draft = loadDraft(
        streamProjectId,
        backendProjectId,
        session.layoutCode || layoutCode,
        apartmentId,
      );
      const result = await postDesignSummary(designCode, {
        selection_revision: 0,
        selections: payloadRef.current,
      });
      if (seq !== seqRef.current) return result;
      saveDraft({
        version: 3,
        streamProjectId,
        projectId: backendProjectId,
        layoutCode: session.layoutCode || layoutCode,
        apartmentId,
        designCode,
        selections: draft?.selections ?? [],
        selectionRevision: 0,
        summaryToken: result.summary_token,
        summaryExpiresAt: result.summary_expires_at,
        updatedAt: new Date().toISOString(),
      });
      setData(result);
      return result;
    } catch (err) {
      if (seq !== seqRef.current) return null;
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
    if (!enabled || !designCode || !session) return;
    const timer = window.setTimeout(() => {
      void refresh();
    }, 400);
    return () => window.clearTimeout(timer);
  }, [enabled, designCode, session, payload, refresh]);

  return { data, loading, error, payload, refresh };
}
