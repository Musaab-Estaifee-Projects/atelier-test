"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Download } from "lucide-react";
import AtelierMark from "@/components/icons/atelier-mark";
import { Button } from "@/components/ui/button";
import { CustomShape } from "@/components/shared/custom-shape";
import { pageNoiseStyle } from "@/lib/ui/page-noise";
import TitleRule from "@/components/icons/title-rule";

type Props = {
  open: boolean;
  designCode: string;
  shareUrl: string;
  unitSubtitle: string;
  email?: string | null;
};

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

const QuotationReady = ({
  open,
  designCode,
  shareUrl,
  unitSubtitle,
  email,
}: Props) => {
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-[70] overflow-y-auto bg-[#00272d] text-white"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quotation-ready-title"
      style={pageNoiseStyle(0.08)}
    >
      <div className="relative mx-auto flex min-h-full w-full max-w-6xl flex-col items-center px-4 py-8 sm:px-8 sm:py-12">
        <AtelierMark />
        <h1
          id="quotation-ready-title"
          className="mt-8 text-center font-baskerville text-[28px] leading-[1.16] font-normal tracking-wider text-[#f2e9d8] sm:text-[36px]"
        >
          Your Quotation is Ready
        </h1>
        <p className="mt-4 text-center text-[13px] leading-[1.2] text-white/70 sm:text-[14px]">
          {unitSubtitle}
        </p>
        <TitleRule className="mt-4 h-px w-32.25" />

        <div className="mt-10 grid w-full gap-5 lg:grid-cols-3">
          <CustomShape
            className="h-full w-full"
            radius={{ base: 18, md: 22 }}
            stroke="rgba(255,255,255,0.16)"
            strokeWidth={1}
          >
            <div className="flex h-full flex-col items-center px-6 py-8 text-center">
              <h2 className="font-baskerville text-[22px] leading-[1.16] tracking-wider text-[#f2e9d8]">
                Get Your Reference Number
              </h2>
              <p className="mt-3 text-[13px] leading-[1.4] text-white/65">
                you can use this reference number to go back to your design
                whenever you want.
              </p>
              <div className="mt-8 flex w-full items-center gap-2 rounded-full border border-white/20 px-4 py-2">
                <p className="min-w-0 flex-1 truncate text-left text-[13px] tracking-wide text-white">
                  {designCode}
                </p>
                <Button
                  type="button"
                  size="pill"
                  className="h-9 shrink-0 rounded-full bg-[#f2e9d8] px-4 text-[10px] tracking-[0.08em] text-[#00272d] hover:bg-[#f2e9d8]/90"
                  onClick={async () => {
                    const ok = await copyText(designCode);
                    if (!ok) return;
                    setCopiedRef(true);
                    window.setTimeout(() => setCopiedRef(false), 1600);
                  }}
                >
                  {copiedRef ? "Copied" : "Copy"}
                  <Copy className="size-3.5" strokeWidth={1.75} />
                </Button>
              </div>
            </div>
          </CustomShape>

          <CustomShape
            className="h-full w-full"
            radius={{ base: 18, md: 22 }}
            stroke="rgba(255,255,255,0.16)"
            strokeWidth={1}
          >
            <div className="flex h-full flex-col items-center px-6 py-8 text-center">
              <h2 className="font-baskerville text-[22px] leading-[1.16] tracking-wider text-[#f2e9d8]">
                Your PDF Quotation
              </h2>
              <p className="mt-3 text-[13px] leading-[1.4] text-white/65">
                We&apos;ve also sent a detailed PDF quotation to your email
                {email ? (
                  <>
                    {" "}
                    at{" "}
                    <span className="text-white/80">{email}</span>
                  </>
                ) : null}{" "}
                for your records.
              </p>
              <Button
                type="button"
                size="pill"
                className="mt-8 h-10 w-full max-w-70 rounded-full bg-[#f2e9d8] text-[10px] tracking-[0.12em] text-[#00272d] hover:bg-[#f2e9d8]/90"
              >
                Download
                <Download className="size-3.5" strokeWidth={1.75} />
              </Button>
            </div>
          </CustomShape>

          <CustomShape
            className="h-full w-full"
            radius={{ base: 18, md: 22 }}
            stroke="rgba(255,255,255,0.16)"
            strokeWidth={1}
          >
            <div className="flex h-full flex-col items-center px-6 py-8 text-center">
              <h2 className="font-baskerville text-[22px] leading-[1.16] tracking-wider text-[#f2e9d8]">
                Share Your Design
              </h2>
              <p className="mt-3 text-[13px] leading-[1.4] text-white/65">
                Anyone with this link can walk through your design.
              </p>
              <div className="mt-8 flex w-full items-center gap-2 rounded-full border border-white/20 px-4 py-2">
                <p className="min-w-0 flex-1 truncate text-left text-[12px] text-white/80">
                  {shareUrl}
                </p>
                <Button
                  type="button"
                  size="pill"
                  className="h-9 shrink-0 rounded-full bg-[#f2e9d8] px-4 text-[10px] tracking-[0.08em] text-[#00272d] hover:bg-[#f2e9d8]/90"
                  onClick={async () => {
                    const ok = await copyText(shareUrl);
                    if (!ok) return;
                    setCopiedShare(true);
                    window.setTimeout(() => setCopiedShare(false), 1600);
                  }}
                >
                  {copiedShare ? "Copied" : "Copy"}
                  <Copy className="size-3.5" strokeWidth={1.75} />
                </Button>
              </div>
            </div>
          </CustomShape>
        </div>

        <h2 className="mt-16 text-center font-baskerville text-[22px] tracking-wider text-[#f2e9d8] sm:text-[26px]">
          What Happens Next
        </h2>
        <p className="mt-3 max-w-md text-center text-[13px] leading-[1.5] text-white/70">
          A design consultant will contact you within one business day to
          confirm the design.
        </p>

        <div className="mt-8 mb-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="pill" size="pill" className="min-w-40">
            <Link href="/">Return to Home</Link>
          </Button>
          <Button
            asChild
            size="pill"
            className="min-w-48 rounded-full bg-[#f2e9d8] text-[#00272d] hover:bg-[#f2e9d8]/90"
          >
            <Link href="/styles">Explore Ready Styles</Link>
          </Button>
        </div>

        <p className="mt-auto pt-10 text-center text-[11px] text-white/45">
          Copyright © {new Date().getFullYear()} Atelier by REEF. All rights
          reserved. · Terms of Service · Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default QuotationReady;
