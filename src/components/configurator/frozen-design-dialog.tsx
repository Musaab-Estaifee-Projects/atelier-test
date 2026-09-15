"use client";

import { Button } from "@/components/ui/button";
import OverlayDialog from "@/components/ui/overlay-dialog";
import { CustomShape } from "@/components/shared/custom-shape";
import { TriangleAlert } from "lucide-react";

type FrozenAction = "new" | "keep";

type Props = {
  open: boolean;
  pending?: FrozenAction | null;
  onKeep: () => void;
  onStartNew: () => void;
  onGoToProjects: () => void;
};

const FrozenDesignDialog = ({
  open,
  pending = null,
  onKeep,
  onStartNew,
  onGoToProjects,
}: Props) => {
  const busy = Boolean(pending);

  return (
    <OverlayDialog
      open={open}
      titleHidden
      closeOnOutsideClick={false}
      onOpenChange={() => undefined}
      title="This design is locked"
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
          <div className="relative z-10 flex flex-col items-center gap-8 px-6 py-8 sm:px-11.5 sm:py-11.5">
            <div className="flex w-full flex-col items-center gap-3.5 text-center">
              <TriangleAlert
                className="h-12 w-14 text-[#F2E9D8]"
                strokeWidth={1}
              />
              <h2 className="font-baskerville text-[1.25rem] font-normal leading-[1.16] text-[#f2e9d8] capitalize md:text-[1.625rem]">
                This design is locked
              </h2>
              <p className="text-sm leading-[1.6] text-white/70">
                Final renders were prepared for this design, so its selections
                can no longer change. Keep your current finishes on a new
                design, start from scratch, or go back to projects.
              </p>
            </div>
            <div className="flex w-full max-w-104.75 flex-col gap-2.5">
              <Button
                type="button"
                variant="pill-solid"
                size="pill"
                className="w-full"
                disabled={busy}
                onClick={onKeep}
              >
                {pending === "keep"
                  ? "Continuing…"
                  : "Keep customization and continue"}
              </Button>
              <Button
                type="button"
                variant="pill-soft"
                size="pill"
                className="w-full"
                disabled={busy}
                onClick={onStartNew}
              >
                {pending === "new" ? "Starting…" : "Start new customization"}
              </Button>
              <Button
                type="button"
                variant="pill-outline"
                size="pill"
                className="w-full"
                disabled={busy}
                onClick={onGoToProjects}
              >
                Go to Projects
              </Button>
            </div>
          </div>
        </CustomShape>
      </div>
    </OverlayDialog>
  );
};

export default FrozenDesignDialog;
