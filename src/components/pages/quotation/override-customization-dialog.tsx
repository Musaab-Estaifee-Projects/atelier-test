"use client";

import { Button } from "@/components/ui/button";
import OverlayDialog from "@/components/ui/overlay-dialog";
import { CustomShape } from "@/components/shared/custom-shape";
import { TriangleAlert } from "lucide-react";

type Props = {
  open: boolean;
  pending?: boolean;
  onCancel: () => void;
  onContinue: () => void;
};

const OverrideCustomizationDialog = ({
  open,
  pending = false,
  onCancel,
  onContinue,
}: Props) => {
  return (
    <OverlayDialog
      open={open}
      titleHidden
      onOpenChange={(next) => {
        if (!next && !pending) onCancel();
      }}
      title="Replace current customization?"
      blur={false}
      overlayClassName="z-[70]"
      contentClassName="z-[70] w-[min(100%-2rem,674px)] flex items-center justify-center"
    >
      <div className="relative w-auto overflow-hidden">
        <CustomShape
          className="h-auto w-auto max-w-153.5"
          radius={{ base: 18, sm: 20, md: 24 }}
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={1}
        >
          <div className="relative z-10 flex flex-col items-center gap-8 px-6 py-8 sm:px-11.5 sm:py-11.5">
            <div className="flex w-full flex-col items-center gap-3.5 text-center">
              <TriangleAlert
                className="h-12 w-14 text-[#F2E9D8]"
                strokeWidth={1}
              />
              <h2 className="font-baskerville text-[1.25rem] font-normal leading-[1.16] text-[#f2e9d8] capitalize md:text-[1.625rem]">
                Replace current customization?
              </h2>
              <p className="text-sm leading-[1.6] text-white/70">
                You already have a customization for this project and layout.
                Continuing will replace it with this quotation.
              </p>
            </div>
            <div className="flex w-full max-w-104.75 flex-col gap-2.5 sm:flex-row">
              <Button
                type="button"
                variant="pill-outline"
                size="pill"
                className="sm:flex-1"
                disabled={pending}
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="pill-soft"
                size="pill"
                className="sm:flex-1"
                disabled={pending}
                onClick={onContinue}
              >
                {pending ? "Continuing…" : "Continue"}
              </Button>
            </div>
          </div>
        </CustomShape>
      </div>
    </OverlayDialog>
  );
};

export default OverrideCustomizationDialog;
