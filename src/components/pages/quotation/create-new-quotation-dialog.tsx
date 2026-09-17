"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import OverlayDialog from "@/components/ui/overlay-dialog";
import { CustomShape } from "@/components/shared/custom-shape";
import { cn } from "@/lib/utils";

export type NewQuotationMode = "keep" | "edit";

type Props = {
  open: boolean;
  onCancel: () => void;
  onContinue: (mode: NewQuotationMode) => void;
  termsHref?: string;
};

const OPTIONS: Array<{
  value: NewQuotationMode;
  title: string;
  description: string;
}> = [
  {
    value: "keep",
    title: "Keep my customization",
    description: "Use my existing selections",
  },
  {
    value: "edit",
    title: "Edit my choices",
    description: "Review and update your selections",
  },
];

const CreateNewQuotationDialog = ({
  open,
  onCancel,
  onContinue,
  termsHref = "/terms",
}: Props) => {
  const [mode, setMode] = useState<NewQuotationMode | null>(null);

  return (
    <OverlayDialog
      open={open}
      titleHidden
      onOpenChange={(next) => {
        if (!next) {
          setMode(null);
          onCancel();
        }
      }}
      title="Create New quotation"
      blur={false}
      overlayClassName="z-52"
      contentClassName="z-52 w-[85dvw] sm:w-[80dvw] md:w-[min(100%-2rem,674px)] flex items-center justify-center"
    >
      <div className="relative w-auto overflow-hidden">
        <CustomShape
          className="w-auto h-auto max-w-153.5"
          radius={{
            base: 18,
            sm: 20,
            md: 24,
          }}
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={1}
        >
          <div className="relative z-10 flex flex-col items-center gap-6 px-6 py-8 sm:px-11.5 sm:py-11.5">
            <div className="flex w-full flex-col items-center gap-3.5 text-center">
              <h2 className="font-baskerville text-[1.25rem] md:text-[1.625rem] leading-[1.16] font-normal text-[#f2e9d8] capitalize">
                Create New quotation
              </h2>

              <p className="text-sm leading-[1.6] text-white/70">
                Your previous quotation has expired. You can start a new
                quotation using your existing choices, or review and update them
                before continuing.
              </p>
            </div>

            <div
              role="radiogroup"
              aria-label="How would you like to continue"
              className="flex w-full max-w-104.75 flex-col gap-2.5"
            >
              {OPTIONS.map((option) => {
                const selected = mode === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setMode(option.value)}
                    className={cn(
                      "flex w-full items-center justify-center gap-3 rounded-full border px-4.75 py-3.5 text-left transition",
                      selected
                        ? "border-white bg-white/5"
                        : "border-white/10 hover:border-white/70",
                    )}
                  >
                    <span
                      className={cn(
                        "border-white mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border transition",
                      )}
                      aria-hidden
                    >
                      {selected ? (
                        <span className="size-2 rounded-full bg-white" />
                      ) : null}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-xs leading-[1.2] tracking-[0.0225rem] text-white uppercase">
                        {option.title}
                      </span>

                      <span className="mt-1 block text-xs leading-[1.6] text-white/70 italic">
                        {option.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="w-full max-w-104.75 text-center text-xs leading-[1.6] text-white/70 italic">
              Please note: prices may differ from your previous quotation.
              <br />
              See our{" "}
              <Link
                href={termsHref}
                className="underline underline-offset-2 text-white font-medium"
              >
                Terms &amp; Conditions
              </Link>{" "}
              for details.
            </p>

            <div className="flex w-full max-w-104.75 flex-col gap-2.5 sm:flex-row">
              <Button
                type="button"
                variant="pill-outline"
                size="pill"
                className="sm:flex-1"
                onClick={() => {
                  setMode(null);
                  onCancel();
                }}
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="pill-soft"
                size="pill"
                className="sm:flex-1"
                disabled={mode == null}
                onClick={() => {
                  if (mode == null) return;
                  onContinue(mode);
                }}
              >
                Continue
              </Button>
            </div>
          </div>
        </CustomShape>
      </div>
    </OverlayDialog>
  );
};

export default CreateNewQuotationDialog;
