"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import OverlayDialog from "@/components/ui/overlay-dialog";
import { CustomShape } from "../shared/custom-shape";

type Props = {
  open: boolean;
  designCode: string;
  shareUrl: string;
  price: number;
  currency?: string;
  onClose: () => void;
};

const DesignSuccess = ({
  open,
  designCode,
  shareUrl,
  price,
  currency = "AED",
  onClose,
}: Props) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <OverlayDialog
      open={open}
      titleHidden
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="Design submitted"
      blur={false}
      overlayClassName="z-52"
      contentClassName="z-52 w-[min(100%-2rem,674px)] flex items-center justify-center"
    >
      <div className="relative w-auto overflow-hidden">
        <CustomShape
          className="w-auto h-auto max-w-[34.375rem]"
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
          <div className="relative z-10 flex flex-col items-center gap-6 px-6 py-8 sm:gap-5 sm:px-11.5 sm:py-11.5">
            <h2 className="mb-2 text-base font-medium text-[#f2e9d8]">
              Design submitted
            </h2>
            <p className="mb-1 text-sm opacity-70 text-[#f2e9d8]">
              Design Code
            </p>
            <p className="mb-3 font-mono text-xl tracking-wide text-[#f2e9d8]">
              {designCode}
            </p>
            <p className="mb-4 text-sm text-[#f2e9d8]">
              Price:{" "}
              <span className="font-medium">
                {currency} {price.toLocaleString()}
              </span>
            </p>
            <p className="mb-2 break-all text-xs opacity-60 text-[#f2e9d8]">
              {shareUrl}
            </p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                className="h-auto rounded-lg bg-white/10 px-3 py-2 text-sm text-[#f5f0e8] hover:bg-white/20 hover:text-[#f5f0e8]"
                onClick={copy}
              >
                {copied ? "Copied" : "Copy share link"}
              </Button>
              <Button
                type="button"
                className="h-auto rounded-lg bg-[#4e9cff] px-3 py-2 text-sm text-white hover:bg-[#4e9cff]/90"
                onClick={onClose}
              >
                View design
              </Button>
            </div>
          </div>
        </CustomShape>
      </div>
    </OverlayDialog>
  );
};

export default DesignSuccess;
