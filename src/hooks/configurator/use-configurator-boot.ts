"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getConfiguratorSession } from "@/lib/configurator/api";
import { ensureBackendDesign } from "@/lib/configurator/ensure-design";
import {
  clearDraftsForLayout,
  markFreshStartIntent,
} from "@/lib/configurator/storage";
import { setActiveCatalogZones } from "@/lib/configurator/zone-catalog";
import { getValidJourneyToken } from "@/lib/journey";
import {
  clearQuotationResume,
  readQuotationResume,
} from "@/lib/quotation/resume-intent";
import type {
  ConfiguratorSession,
  ShareableConfiguratorParams,
} from "@/types/configurator";

type Args = {
  projectId: string;
  catalogApiProjectId: string | null;
  layoutCode: string;
  apartmentId: string | null;
  unitId: string | null;
  viewOnly: boolean;
  setParams: (
    patch: Partial<ShareableConfiguratorParams>,
    options?: { replace?: boolean },
  ) => void;
};

/**
 * Journey gate → layout catalog → design code. The quotation resume intent
 * (sessionStorage) decides whether to view, edit, or start fresh.
 */
export function useConfiguratorBoot({
  projectId,
  catalogApiProjectId,
  layoutCode,
  apartmentId,
  unitId,
  viewOnly,
  setParams,
}: Args) {
  const [journeyReady, setJourneyReady] = useState<boolean | null>(null);
  const [session, setSession] = useState<ConfiguratorSession | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [designCode, setDesignCodeState] = useState<string | null>(null);
  const designCodeRef = useRef<string | null>(null);
  const returningVisitRef = useRef(false);
  /** View-only "Edit" asked for a journey token; resume the edit once granted. */
  const pendingViewEditRef = useRef(false);

  const setDesignCode = useCallback((code: string | null) => {
    designCodeRef.current = code;
    setDesignCodeState(code);
  }, []);

  useEffect(() => {
    if (viewOnly && !pendingViewEditRef.current) {
      setJourneyReady(true);
      return;
    }
    setJourneyReady(Boolean(getValidJourneyToken()));
  }, [viewOnly]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- nothing to load until the gate passes
    if (journeyReady === false) setSessionLoading(false);
  }, [journeyReady]);

  useEffect(() => {
    if (journeyReady !== true) return;
    let cancelled = false;
    (async () => {
      setSessionLoading(true);
      setSessionError(null);

      try {
        if (!catalogApiProjectId) {
          throw new Error(
            "A valid project or layout is required to load this apartment catalog.",
          );
        }

        const sess = await getConfiguratorSession({
          streamProjectId: projectId,
          backendProjectId: catalogApiProjectId,
          layoutCode,
          unitId,
        });
        if (cancelled) return;
        setActiveCatalogZones(sess.zones);
        setSession(sess);

        const resume = readQuotationResume();
        const resumeMatches =
          Boolean(resume) &&
          resume!.streamProjectId === projectId &&
          resume!.projectId === catalogApiProjectId &&
          resume!.layoutCode === sess.layoutCode;

        if (viewOnly && resumeMatches && resume?.mode === "view") {
          returningVisitRef.current = true;
          setDesignCode(resume.sourceDesignCode);
        } else if (!viewOnly && resumeMatches && resume?.mode === "edit") {
          returningVisitRef.current = true;
          setDesignCode(resume.clonedDesignCode || resume.sourceDesignCode);
        } else if (!viewOnly && resumeMatches && resume?.mode === "fresh") {
          clearDraftsForLayout(projectId, catalogApiProjectId, sess.layoutCode);
          markFreshStartIntent(
            projectId,
            catalogApiProjectId,
            sess.layoutCode,
            apartmentId,
          );
          const ensured = await ensureBackendDesign({
            streamProjectId: projectId,
            backendProjectId: catalogApiProjectId,
            layoutCode: sess.layoutCode,
            apartmentId,
          });
          if (cancelled) return;
          clearQuotationResume();
          returningVisitRef.current = false;
          setDesignCode(ensured.designCode);
        } else if (!viewOnly) {
          const ensured = await ensureBackendDesign({
            streamProjectId: projectId,
            backendProjectId: catalogApiProjectId,
            layoutCode: sess.layoutCode,
            apartmentId,
          });
          if (cancelled) return;
          returningVisitRef.current = ensured.returning;
          setDesignCode(ensured.designCode);
        }

        if (cancelled) return;
        setParams(
          {
            backendProjectId: catalogApiProjectId,
            layoutCode: sess.layoutCode,
            apartmentId,
            apartmentNumber: unitId,
          },
          { replace: true },
        );
      } catch (e: unknown) {
        if (cancelled) return;
        setSessionError(
          e instanceof Error ? e.message : "Failed to load catalog",
        );
      } finally {
        if (!cancelled) setSessionLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Boot once per project/layout/apartment; viewOnly and unitId changes
    // during the session must not re-run the catalog + design bootstrap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journeyReady, projectId, catalogApiProjectId, layoutCode, apartmentId]);

  return {
    journeyReady,
    setJourneyReady,
    pendingViewEditRef,
    session,
    sessionError,
    sessionLoading,
    designCode,
    designCodeRef,
    setDesignCode,
    returningVisitRef,
  };
}
