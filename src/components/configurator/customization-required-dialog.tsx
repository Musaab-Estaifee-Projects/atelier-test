"use client";

import { Button } from "@/components/ui/button";
import OverlayDialog from "@/components/ui/overlay-dialog";
import { CustomShape } from "@/components/shared/custom-shape";
import { TriangleAlert } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
};

const CustomizationRequiredDialog = ({ open, onClose }: Props) => {
  return (
    <OverlayDialog
      open={open}
      titleHidden
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="Customization Required"
      blur={false}
      overlayClassName="z-[60]"
      contentClassName="z-[60] w-[min(100%-2rem,674px)] flex items-center justify-center"
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
          <div className="relative z-10 flex flex-col items-center gap-8 px-6 py-8 sm:px-11.5 sm:py-11.5">
            <div className="flex w-full flex-col items-center gap-3.5 text-center">
              <TriangleAlert
                className="h-12 w-14 text-[#F2E9D8]"
                strokeWidth={1}
              />
              <h2 className="font-baskerville text-[1.25rem] font-normal leading-[1.16] text-[#f2e9d8] capitalize md:text-[1.625rem]">
                Customization Required
              </h2>
              <p className="text-sm leading-[1.6] text-white/70">
                Your quotation is based on the material changes you make to your
                space. Please select a material or a finish to continue.
              </p>
            </div>
            <Button
              type="button"
              variant="pill-soft"
              size="pill"
              className="w-full max-w-104.75"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </CustomShape>
      </div>
    </OverlayDialog>
  );
};

export default CustomizationRequiredDialog;
