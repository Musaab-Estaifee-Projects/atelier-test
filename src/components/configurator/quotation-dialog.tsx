"use client";

import { Button } from "@/components/ui/button";
import OverlayDialog from "@/components/ui/overlay-dialog";
import { CustomShape } from "../shared/custom-shape";

type Props = {
  open: boolean;
  onBack: () => void;
  onGoToSummary: () => void;
};

const QuotationDialog = ({ open, onBack, onGoToSummary }: Props) => {
  return (
    <OverlayDialog
      open={open}
      titleHidden
      onOpenChange={(next) => {
        if (!next) onBack();
      }}
      title="Ready to prepare your final design?"
      blur={false}
      overlayClassName="z-52"
      contentClassName="z-52 w-[min(100%-2rem,674px)] flex items-center justify-center"
    >
      <div className="relative w-auto overflow-hidden">
        <CustomShape
          className="w-auto h-auto max-w-[38.375rem]"
          radius={{
            base: 18,
            sm: 20,
            md: 24,
          }}
          // fill="#0a2f35"
          // fill="gradient"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={1}
        >
          <div className="relative z-10 flex flex-col items-center gap-8 px-6 py-8 sm:px-11.5 sm:py-11.5">
            <div className="flex w-full flex-col items-center gap-[0.875rem] text-center">
              <h2 className="font-baskerville text-[1.25rem] md:text-[1.625rem] leading-[1.16] font-normal text-[#f2e9d8] capitalize">
                Ready to prepare your final design?
              </h2>

              <p className="text-sm leading-[1.6] text-white/70">
                We’ll create final renders based on your selected materials and
                finishes. You’ll be able to review your design and prices before
                requesting your final quote.
              </p>
            </div>

            <div className="flex w-full max-w-104.75 flex-col gap-[0.625rem] sm:flex-row">
              <Button
                type="button"
                variant="pill-outline"
                size="pill"
                className="sm:flex-1"
                onClick={onBack}
              >
                Back to customize
              </Button>

              <Button
                type="button"
                variant="pill-soft"
                size="pill"
                className="sm:flex-1"
                onClick={onGoToSummary}
              >
                Go to summary
              </Button>
            </div>
          </div>
        </CustomShape>
      </div>
    </OverlayDialog>
  );
};

export default QuotationDialog;
