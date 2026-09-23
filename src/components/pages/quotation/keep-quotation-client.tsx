"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "@/app/configurator/configurator.css";
import JourneyGate from "@/components/configurator/journey-gate";
import ReviewSelections from "@/components/configurator/review-selections";
import FinalDesignProgress from "@/components/configurator/final-design/final-design-progress";
import FinalDesignViewer from "@/components/configurator/final-design/final-design-viewer";
import RendersNotReadyDialog from "@/components/configurator/renders-not-ready-dialog";
import QuotationReady from "@/components/configurator/quotation-ready";
import { newIdempotencyKey } from "@/lib/configurator/storage";
import { getValidJourneyToken, readJourney } from "@/lib/journey";
import { cloneQuotationDesign } from "@/lib/quotation/clone-design";
import { quotationResidenceSubtitle } from "@/lib/quotation/display";
import { clearQuotationResume } from "@/lib/quotation/resume-intent";
import { confirmDesign } from "@/services/confirm-design.service";
import { isAxiosError } from "axios";
import {
  getRenders,
  parseRenderTotalAmount,
  prepareRenders,
  type GetRendersData,
} from "@/services/renders.service";
import type { ConfirmDesignData } from "@/services/confirm-design.service";
import type { DesignSummaryData } from "@/services/post-design-summary.service";
import type { SavedDesignData } from "@/services/get-saved-design.service";
import type { StoredSelection } from "@/types/stored-selection";
import type { RoomRenderCard } from "@/types/configurator";
import type { LightboxStill } from "@/components/configurator/final-design/final-design-viewer";

const POLL_MS = 3000;

type Phase = "review" | "renders" | "ready";

function roomsFromRenders(data: GetRendersData | null): RoomRenderCard[] {
  if (!data?.camera_zones.length) return [];
  return data.camera_zones.map((zone) => {
    const cams = zone.cameras ?? [];
    const stills = cams.map((cam) => ({
      cameraName: cam.camera_id,
      imageUrl: cam.render_s3_url ?? undefined,
    }));
    const allDone =
      cams.length > 0 &&
      cams.every((c) => c.status === "completed" && c.render_s3_url);
    const anyFailed = cams.some((c) => c.is_failed || c.status === "failed");
    const hero = cams.find((c) => c.render_s3_url) ?? cams[0];
    return {
      zoneId: zone.camera_zone_id,
      label: zone.camera_zone_name?.trim() || zone.camera_zone_id,
      ueZone: zone.camera_zone_id,
      heroCameraName: hero?.camera_id ?? zone.camera_zone_id,
      heroCameraIndex: 0,
      status: allDone ? "completed" : anyFailed ? "error" : "rendering",
      imageUrl: hero?.render_s3_url ?? undefined,
      attempt: Math.max(0, ...cams.map((c) => c.attempt_number || 1), 1),
      stills,
    };
  });
}

type Props = {
  source: SavedDesignData;
};

const KeepQuotationClient = ({ source }: Props) => {
  const router = useRouter();
  const unitSubtitle = quotationResidenceSubtitle(source.property);
  const [journeyReady, setJourneyReady] = useState<boolean | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const [designCode, setDesignCode] = useState<string | null>(null);
  const [summary, setSummary] = useState<DesignSummaryData | null>(null);
  const [prepareSelections, setPrepareSelections] = useState<StoredSelection[]>(
    [],
  );
  const [phase, setPhase] = useState<Phase>("review");
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<ConfirmDesignData | null>(null);
  const [renders, setRenders] = useState<GetRendersData | null>(null);
  const [rendersError, setRendersError] = useState<string | null>(null);
  const [rendersPending, setRendersPending] = useState(false);
  const [rendersNotReadyOpen, setRendersNotReadyOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const cloneOnceRef = useRef(false);
  const confirmOnceRef = useRef(false);
  const pollRef = useRef<number | null>(null);
  const phaseRef = useRef(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.classList.add("configurator-active");
    body.classList.add("configurator-active");
    return () => {
      html.classList.remove("configurator-active");
      body.classList.remove("configurator-active");
    };
  }, []);

  useEffect(() => {
    setJourneyReady(Boolean(getValidJourneyToken()));
  }, []);

  useEffect(() => {
    if (!journeyReady || cloneOnceRef.current) return;
    cloneOnceRef.current = true;
    clearQuotationResume();

    const streamId = source.property.project.streampixel_app_id?.trim();
    const projectId = String(source.property.project.id);
    const layoutCode = source.property.layout.code;
    const apartmentId =
      source.property.apartment?.id != null
        ? String(source.property.apartment.id)
        : null;

    void (async () => {
      const cloned = await cloneQuotationDesign({
        sourceDesignCode: source.design_code,
        streamProjectId: streamId || projectId,
        backendProjectId: projectId,
        layoutCode,
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
  }, [journeyReady, source]);

  const stopPoll = useCallback(() => {
    if (pollRef.current != null) {
      window.clearTimeout(pollRef.current);
      pollRef.current = null;
    }
  }, []);

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
        stopPoll();
        pollRef.current = window.setTimeout(() => {
          void pollRenders(code);
        }, POLL_MS);
      } catch (err) {
        if (phaseRef.current !== "renders") return;
        setRendersError(
          err instanceof Error ? err.message : "Failed to load render progress",
        );
        stopPoll();
        pollRef.current = window.setTimeout(() => {
          void pollRenders(code);
        }, POLL_MS);
      }
    },
    [stopPoll],
  );

  useEffect(() => () => stopPoll(), [stopPoll]);

  const startRenders = useCallback(async () => {
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
        newIdempotencyKey(),
      );
      setPhase("renders");
      phaseRef.current = "renders";
      await pollRenders(code);
    } catch (err) {
      const message = isAxiosError(err)
        ? String(
            (err.response?.data as { message?: string } | undefined)?.message ||
              err.message ||
              "Failed to prepare renders",
          )
        : err instanceof Error
          ? err.message
          : "Failed to prepare renders";
      setRendersError(message);
    } finally {
      setRendersPending(false);
    }
  }, [designCode, pollRenders, prepareSelections, summary?.summary_token]);

  const rooms = useMemo(() => roomsFromRenders(renders), [renders]);
  const stills: LightboxStill[] = useMemo(
    () =>
      (renders?.camera_zones ?? []).flatMap((zone) =>
        zone.cameras
          .filter((c) => c.render_s3_url)
          .map((c) => ({
            cameraName: c.camera_id,
            cameraLabel: c.camera_name?.trim() || c.camera_id,
            zoneId: zone.camera_zone_id,
            zoneName: zone.camera_zone_name?.trim() || zone.camera_zone_id,
            label: `${zone.camera_zone_name?.trim() || zone.camera_zone_id} - ${c.camera_name?.trim() || c.camera_id}`,
            imageUrl: c.render_s3_url as string,
          })),
      ),
    [renders],
  );

  const handleConfirm = useCallback(async () => {
    if (confirmOnceRef.current) return;
    if (!renders?.is_all_rendered) {
      setRendersNotReadyOpen(true);
      return;
    }
    const code = designCode?.trim();
    if (!code) {
      setConfirmError("Missing design code. Please try again.");
      return;
    }
    confirmOnceRef.current = true;
    setConfirming(true);
    setConfirmError(null);
    try {
      const result = await confirmDesign(code);
      if (!result.ok) {
        confirmOnceRef.current = false;
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

  const quotationHref = `/quotation/${encodeURIComponent(source.design_code)}`;

  if (journeyReady === false) {
    return (
      <div className="fixed inset-0 h-dvh overflow-hidden bg-[#00272d]">
        <JourneyGate onReady={() => setJourneyReady(true)} />
      </div>
    );
  }

  if (bootError) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#00272d] px-6 text-center text-white">
        <p className="max-w-md text-sm leading-6 text-white/80">{bootError}</p>
        <button
          type="button"
          className="text-[12px] tracking-[0.08em] uppercase text-[#f2e9d8] underline"
          onClick={() => router.push(quotationHref)}
        >
          Back to quotation
        </button>
      </div>
    );
  }

  const summaryReady = Boolean(designCode && summary);

  return (
    <div className="fixed inset-0 h-dvh overflow-hidden bg-[#00272d]">
      <ReviewSelections
        open={phase === "review"}
        unitSubtitle={unitSubtitle}
        summary={summary}
        summaryLoading={!summaryReady}
        confirmPending={rendersPending || !summaryReady}
        confirmLabel="Continue to renders"
        backLabel="Back to quotation"
        confirmError={rendersError}
        onBack={() => router.push(quotationHref)}
        onConfirm={() => {
          if (!summaryReady) return;
          void startRenders();
        }}
      />

      <FinalDesignProgress
        open={phase === "renders"}
        rooms={rooms}
        unitSubtitle={unitSubtitle}
        error={rendersError}
        total={parseRenderTotalAmount(renders?.total_amount)}
        title="Getting Final Renders"
        skeleton
        confirmPending={confirming}
        confirmDisabled={!renders?.is_all_rendered}
        confirmError={confirmError}
        onConfirm={() => {
          void handleConfirm();
        }}
        onBack={() => {
          stopPoll();
          setPhase("review");
        }}
        onView={(zoneId, cameraName) => {
          const index = stills.findIndex(
            (s) =>
              s.zoneId === zoneId &&
              (!cameraName || s.cameraName === cameraName),
          );
          if (index >= 0) setLightboxIndex(index);
        }}
        onRetry={() => undefined}
        onSubmit={() => undefined}
      />

      <FinalDesignViewer
        stills={stills}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
        onClose={() => setLightboxIndex(null)}
      />

      <RendersNotReadyDialog
        open={rendersNotReadyOpen}
        onClose={() => setRendersNotReadyOpen(false)}
      />

      <QuotationReady
        open={phase === "ready"}
        designCode={confirmed?.design_code ?? designCode ?? source.design_code}
        unitSubtitle={unitSubtitle}
        email={readJourney()?.customer.email}
        pdfStatus={confirmed?.pdf_status}
        emailStatus={confirmed?.email_status}
      />
    </div>
  );
};

export default KeepQuotationClient;
