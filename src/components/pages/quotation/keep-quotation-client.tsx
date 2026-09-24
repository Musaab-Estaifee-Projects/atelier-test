"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "@/app/configurator/configurator.css";
import JourneyGate from "@/components/configurator/journey-gate";
import ReviewSelections from "@/components/configurator/review-selections";
import FinalDesignProgress from "@/components/configurator/final-design/final-design-progress";
import FinalDesignViewer from "@/components/configurator/final-design/final-design-viewer";
import RendersNotReadyDialog from "@/components/configurator/renders-not-ready-dialog";
import QuotationReady from "@/components/configurator/quotation-ready";
import { useKeepQuotation } from "@/hooks/quotation/use-keep-quotation";
import { getValidJourneyToken, readJourney } from "@/lib/journey";
import { quotationResidenceSubtitle } from "@/lib/quotation/display";
import { quotationPath } from "@/lib/quotation/share-url";
import type { SavedDesignData } from "@/services/get-saved-design.service";

type Props = {
  source: SavedDesignData;
};

const KeepQuotationClient = ({ source }: Props) => {
  const router = useRouter();
  const unitSubtitle = quotationResidenceSubtitle(source.property);
  const [journeyReady, setJourneyReady] = useState<boolean | null>(null);
  const keep = useKeepQuotation(source, journeyReady === true);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- token lives in localStorage, unavailable during SSR
    setJourneyReady(Boolean(getValidJourneyToken()));
  }, []);

  const quotationHref = quotationPath(source.design_code);

  if (journeyReady === false) {
    return (
      <div className="fixed inset-0 h-dvh overflow-hidden bg-[#00272d]">
        <JourneyGate onReady={() => setJourneyReady(true)} />
      </div>
    );
  }

  if (keep.bootError) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#00272d] px-6 text-center text-white">
        <p className="max-w-md text-sm leading-6 text-white/80">
          {keep.bootError}
        </p>
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

  return (
    <div className="fixed inset-0 h-dvh overflow-hidden bg-[#00272d]">
      <ReviewSelections
        open={keep.phase === "review"}
        unitSubtitle={unitSubtitle}
        summary={keep.summary}
        summaryLoading={!keep.summaryReady}
        confirmPending={keep.rendersPending || !keep.summaryReady}
        confirmLabel="Continue to renders"
        backLabel="Back to quotation"
        confirmError={keep.rendersError}
        onBack={() => router.push(quotationHref)}
        onConfirm={() => {
          if (!keep.summaryReady) return;
          void keep.startRenders();
        }}
      />

      <FinalDesignProgress
        open={keep.phase === "renders"}
        rooms={keep.rooms}
        unitSubtitle={unitSubtitle}
        error={keep.rendersError}
        total={keep.totalAmount}
        title="Getting Final Renders"
        skeleton
        confirmPending={keep.confirming}
        confirmDisabled={!keep.renders?.is_all_rendered}
        confirmError={keep.confirmError}
        onConfirm={() => {
          void keep.confirm();
        }}
        onView={keep.openViewer}
        onRetry={() => undefined}
      />

      <FinalDesignViewer
        stills={keep.stills}
        index={keep.lightboxIndex}
        onIndexChange={keep.setLightboxIndex}
        onClose={() => keep.setLightboxIndex(null)}
      />

      <RendersNotReadyDialog
        open={keep.rendersNotReadyOpen}
        onClose={keep.closeRendersNotReady}
      />

      <QuotationReady
        open={keep.phase === "ready"}
        designCode={
          keep.confirmed?.design_code ?? keep.designCode ?? source.design_code
        }
        unitSubtitle={unitSubtitle}
        email={readJourney()?.customer.email}
        pdfStatus={keep.confirmed?.pdf_status}
        emailStatus={keep.confirmed?.email_status}
      />
    </div>
  );
};

export default KeepQuotationClient;
