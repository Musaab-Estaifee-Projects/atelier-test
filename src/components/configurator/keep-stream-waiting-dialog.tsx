"use client";

import OverlayDialog from "@/components/ui/overlay-dialog";
import { CustomShape } from "@/components/shared/custom-shape";
import { Loader2 } from "lucide-react";

type Props = {
  open: boolean;
};

const KeepStreamWaitingDialog = ({ open }: Props) => {
  return (
    <OverlayDialog
      open={open}
      titleHidden
      closeOnOutsideClick={false}
      onOpenChange={() => undefined}
      title="Waiting for the 3D session"
      blur={false}
      overlayClassName="z-[91]"
      contentClassName="z-[91] w-[min(100%-2rem,674px)] flex items-center justify-center"
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
              <Loader2
                className="h-12 w-12 animate-spin text-[#F2E9D8]"
                strokeWidth={1.4}
              />
              <h2 className="font-baskerville text-[1.25rem] font-normal leading-[1.16] text-[#f2e9d8] capitalize md:text-[1.625rem]">
                Waiting for the 3D session
              </h2>
              <p className="text-sm leading-[1.6] text-white/70">
                The live view is reconnecting or still opening your apartment.
                Please stay with us — this can take a minute on a slower
                connection, then we&apos;ll save your finishes automatically.
              </p>
            </div>
          </div>
        </CustomShape>
      </div>
    </OverlayDialog>
  );
};

export default KeepStreamWaitingDialog;
