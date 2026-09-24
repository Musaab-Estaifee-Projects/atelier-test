"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import OverlayDialog from "@/components/ui/overlay-dialog";
import { CustomShape } from "@/components/shared/custom-shape";

const TERMS = [
  "Rendered visuals are for reference and may vary slightly from final materials.",
  "Prices and material availability are subject to confirmation in the final quote.",
  "Changes to your selections may affect pricing.",
  "You will have 7 days to review and confirm your final design and quote.",
] as const;

type Props = {
  open: boolean;
  onCancel: () => void;
  onAgree: () => void;
  termsHref?: string;
};

const ConfirmTermsDialog = ({
  open,
  onCancel,
  onAgree,
  termsHref = "/terms",
}: Props) => {
  return (
    <OverlayDialog
      open={open}
      titleHidden
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
      title="Confirm Our Terms"
      blur={false}
      overlayClassName="z-[90]"
      contentClassName="z-[90] w-[min(100%-2rem,674px)] flex items-center justify-center"
    >
      <div className="relative w-auto overflow-hidden">
        <CustomShape
          className="h-auto w-auto max-w-153.5"
          radius={{
            base: 18,
            sm: 20,
            md: 24,
          }}
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={1}
        >
          <div className="relative z-10 flex flex-col items-center gap-6 px-6 py-8 sm:px-11.5 sm:py-11.5">
            <div className="flex w-full flex-col items-center gap-6 text-center">
              <h2 className="font-baskerville text-[1.25rem] font-normal leading-[1.16] text-[#f2e9d8] capitalize md:text-[1.625rem]">
                Confirm Our Terms
              </h2>

              <ol className="mt-4 flex w-full max-w-104.75 flex-col gap-1.75 text-left">
                {TERMS.map((line, index) => (
                  <li key={line} className="flex items-start gap-3">
                    <span
                      className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold leading-none text-white border border-white/10"
                      aria-hidden
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 text-sm leading-normal text-white/70">
                      {line}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-2 flex w-full max-w-104.75 flex-col gap-2.5 sm:flex-row">
              <Button
                type="button"
                variant="pill-outline"
                size="pill"
                className="sm:flex-1"
                onClick={onCancel}
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="pill-soft"
                size="pill"
                className="sm:flex-1"
                onClick={onAgree}
              >
                Agree and Continue
              </Button>
            </div>

            <p className="w-full max-w-104.75 text-center text-[0.625rem] leading-[1.6] text-white/70">
              Having any question? please check our{" "}
              <Link
                href={termsHref}
                className="text-white/70 underline underline-offset-2"
              >
                Terms &amp; conditions
              </Link>
            </p>
          </div>
        </CustomShape>
      </div>
    </OverlayDialog>
  );
};

export default ConfirmTermsDialog;
