"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { OverlayDialog } from "@/components/ui/overlay-dialog";

type Props = {
  open: boolean;
  designCode: string;
  shareUrl: string;
  price: number;
  currency?: string;
  onClose: () => void;
};

export default function DesignSuccess({
  open,
  designCode,
  shareUrl,
  price,
  currency = "AED",
  onClose,
}: Props) {
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
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="Design submitted"
      blur={false}
      overlayClassName="z-[80] bg-black/60"
      contentClassName="z-[80] w-[min(100%-2rem,28rem)]"
    >
      <div className="w-full rounded-xl border border-white/10 bg-[#1a1a1c] p-5 text-[#f5f0e8]">
        <h2 className="mb-2 text-base font-medium">Design submitted</h2>
        <p className="mb-1 text-sm opacity-70">Design Code</p>
        <p className="mb-3 font-mono text-xl tracking-wide">{designCode}</p>
        <p className="mb-4 text-sm">
          Price:{" "}
          <span className="font-medium">
            {currency} {price.toLocaleString()}
          </span>
        </p>
        <p className="mb-2 break-all text-xs opacity-60">{shareUrl}</p>
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
    </OverlayDialog>
  );
}
