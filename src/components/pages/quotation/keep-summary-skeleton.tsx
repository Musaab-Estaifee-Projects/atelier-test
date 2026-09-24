"use client";

import "@/app/configurator/configurator.css";
import ReviewSelections from "@/components/configurator/review-selections";

type Props = {
  unitSubtitle?: string;
};

/** Instant loading UI for `/quotation/[slug]/keep` (summary review chrome). */
const KeepSummarySkeleton = ({
  unitSubtitle = "Your residence",
}: Props) => {
  return (
    <div className="fixed inset-0 h-dvh overflow-hidden bg-[#00272d]">
      <ReviewSelections
        open
        unitSubtitle={unitSubtitle}
        summaryLoading
        confirmPending
        confirmLabel="Continue to renders"
        backLabel="Back to quotation"
        onBack={() => undefined}
        onConfirm={() => undefined}
      />
    </div>
  );
};

export default KeepSummarySkeleton;
