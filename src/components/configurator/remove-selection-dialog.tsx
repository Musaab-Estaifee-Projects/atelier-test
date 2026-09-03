"use client";

import { Button } from "@/components/ui/button";
import OverlayDialog from "@/components/ui/overlay-dialog";
import { CustomShape } from "@/components/shared/custom-shape";
import { TriangleAlert } from "lucide-react";

type Props = {
  open: boolean;
  surfaceLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

const RemoveSelectionDialog = ({
  open,
  surfaceLabel,
  onCancel,
  onConfirm,
}: Props) => {
  return (
    <OverlayDialog
      open={open}
      titleHidden
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
      title="Are you sure you want to remove this?"
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
                className="w-14 h-12 text-[#F2E9D8]"
                strokeWidth={1}
              />
              <h2 className="font-baskerville text-[1.25rem] font-normal leading-[1.16] text-[#f2e9d8] capitalize md:text-[1.625rem]">
                Are you sure you want to remove this?
              </h2>

              <p className="text-sm leading-[1.6] text-white/70">
                {surfaceLabel
                  ? `“${surfaceLabel}” will be removed from your selections and will use the standard finish.`
                  : "This selection will be removed and will use the standard finish."}
              </p>
            </div>

            <div className="flex w-full max-w-104.75 flex-col gap-2.5 sm:flex-row">
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
                onClick={onConfirm}
              >
                Remove
              </Button>
            </div>
          </div>
        </CustomShape>
      </div>
    </OverlayDialog>
  );
};

export default RemoveSelectionDialog;
