"use client";

import { Button } from "@/components/ui/button";
import { OverlayDialog } from "@/components/ui/overlay-dialog";

type Props = {
  open: boolean;
  onBack: () => void;
  onGoToSummary: () => void;
};

export default function QuotationDialog({
  open,
  onBack,
  onGoToSummary,
}: Props) {
  return (
    <OverlayDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onBack();
      }}
      title="Ready to prepare your final design?"
      blur={false}
      overlayClassName="z-[52]"
      contentClassName="z-[52] w-[min(100%-2rem,674px)]"
    >
      <div className="relative w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/quotation/dialog-frame.svg"
          alt=""
          className="pointer-events-none absolute inset-0 hidden h-full w-full sm:block"
        />
        <div className="absolute inset-0 bg-[#00272d] sm:hidden" />

        <div className="relative z-10 flex flex-col items-center gap-6 px-6 py-8 sm:gap-5 sm:px-[46px] sm:py-[46px]">
          <div className="flex w-full flex-col items-center gap-6 text-center sm:gap-[27px] sm:pt-1 sm:pb-2.5">
            <h2 className="font-libre-baskerville text-[clamp(24px,4vw,36px)] leading-[1.16] font-normal text-[#f2e9d8]">
              Ready to prepare your final design?
            </h2>
            <p className="max-w-[582px] text-[14px] leading-[1.6] text-white/70">
              We’ll create final renders based on your selected materials and
              finishes. You’ll be able to review your design and prices before
              requesting your final quote.
            </p>
          </div>

          <div className="flex w-full max-w-[419px] flex-col gap-2.5 sm:flex-row sm:gap-2.5">
            <Button
              type="button"
              variant="pill-outline"
              size="pill"
              className="flex-1"
              onClick={onBack}
            >
              Back to customize
            </Button>
            <Button
              type="button"
              variant="pill"
              size="pill"
              className="flex-1"
              onClick={onGoToSummary}
            >
              Go to summary
            </Button>
          </div>
        </div>
      </div>
    </OverlayDialog>
  );
}
