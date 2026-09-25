"use client";

import { AtelierSpinner } from "@/components/ui/atelier-spinner";
import { Button } from "@/components/ui/button";
import OverlayDialog from "@/components/ui/overlay-dialog";
import { CustomShape } from "@/components/shared/custom-shape";

type Props = {
  open: boolean;
  checking: boolean;
  onRetry: () => void;
  onBack: () => void;
};

const StreamTabLockDialog = ({ open, checking, onRetry, onBack }: Props) => {
  return (
    <OverlayDialog
      open={open}
      titleHidden
      closeOnOutsideClick={false}
      onOpenChange={() => {}}
      title="Already opened in another tab"
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
              <h2 className="font-baskerville text-[1.25rem] font-normal leading-[1.16] text-[#f2e9d8] capitalize md:text-[1.625rem]">
                Already opened in another tab
              </h2>
              <p className="text-sm leading-[1.6] text-white/70">
                This layout is already opened in another browser tab. Close that
                tab, then try again here, or continue with the layout in the
                other tab.
              </p>
            </div>
            <div className="flex w-full max-w-104.75 flex-col gap-2.5 sm:flex-row">
              <Button
                type="button"
                variant="pill-outline"
                size="pill"
                className="sm:flex-1"
                onClick={onBack}
                disabled={checking}
              >
                Back to projects
              </Button>
              <Button
                type="button"
                variant="pill-soft"
                size="pill"
                className="sm:flex-1"
                onClick={onRetry}
                disabled={checking}
                aria-busy={checking}
              >
                {checking ? <AtelierSpinner sizeClassName="size-4" /> : null}
                {checking ? "Trying" : "Try again"}
              </Button>
            </div>
          </div>
        </CustomShape>
      </div>
    </OverlayDialog>
  );
};

export default StreamTabLockDialog;
