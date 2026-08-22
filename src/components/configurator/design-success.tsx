// src/components/configurator/design-success.tsx
"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

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
  if (!open || typeof document === "undefined") return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#1a1a1c] p-5 text-[#f5f0e8]">
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
          <button
            type="button"
            className="rounded-lg bg-white/10 px-3 py-2 text-sm"
            onClick={copy}
          >
            {copied ? "Copied" : "Copy share link"}
          </button>
          <button
            type="button"
            className="rounded-lg bg-[#4e9cff] px-3 py-2 text-sm text-white"
            onClick={onClose}
          >
            View design
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
