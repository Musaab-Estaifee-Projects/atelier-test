"use client";

import { Button } from "@/components/ui/button";
import OverlayDialog from "@/components/ui/overlay-dialog";
import { CustomShape } from "@/components/shared/custom-shape";
import { DoorOpen } from "lucide-react";

type Props = {
  open: boolean;
  onBack: () => void;
};

const ViewVisitRequiredDialog = ({ open, onBack }: Props) => {
  return (
    <OverlayDialog
      open={open}
      titleHidden
      closeOnOutsideClick={false}
      onOpenChange={() => {}}
      title="Open this from Walk in 3D"
      blur={false}
      overlayClassName="z-[80]"
      contentClassName="z-[80] w-[min(100%-2rem,674px)] flex items-center justify-center"
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
              <DoorOpen className="h-12 w-14 text-[#F2E9D8]" strokeWidth={1} />
              <h2 className="font-baskerville text-[1.25rem] font-normal leading-[1.16] text-[#f2e9d8] capitalize md:text-[1.625rem]">
                Open this from Walk in 3D
              </h2>
              <p className="text-sm leading-[1.6] text-white/70">
                This view only opens after you choose Walk in 3D on the
                quotation. This tab does not have that saved visit.
              </p>
            </div>
            <div className="flex w-full max-w-104.75 flex-col gap-2.5">
              <Button
                type="button"
                variant="pill-soft"
                size="pill"
                onClick={onBack}
              >
                Back to projects
              </Button>
            </div>
          </div>
        </CustomShape>
      </div>
    </OverlayDialog>
  );
};

export default ViewVisitRequiredDialog;
