"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Copy } from "lucide-react";
import AtelierMark from "@/components/icons/atelier-mark";
import { Button } from "@/components/ui/button";
import { CustomShape } from "@/components/shared/custom-shape";
import { pageNoiseStyle } from "@/lib/ui/page-noise";
import TitleRule from "@/components/icons/title-rule";
import Bg from "../shared/bg";
import {
  formatQuotationJobStatus,
  quotationJobKind,
} from "@/lib/quotation/job-status";
import { quotationShareUrl } from "@/lib/quotation/share-url";

type Props = {
  open: boolean;
  designCode: string;
  unitSubtitle: string;
  email?: string | null;
  pdfStatus?: string | null;
  emailStatus?: string | null;
};

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

function pdfCopy(kind: ReturnType<typeof quotationJobKind>) {
  if (kind === "complete") return "Your detailed PDF quotation is ready.";
  if (kind === "failed") {
    return "We could not generate the PDF quotation yet. A design consultant will follow up.";
  }
  return "Your detailed PDF quotation is being prepared.";
}

function emailCopy(
  kind: ReturnType<typeof quotationJobKind>,
  email?: string | null,
) {
  const at = email ? (
    <>
      {" "}
      at <span className="text-white/80">{email}</span>
    </>
  ) : null;
  if (kind === "complete") {
    return (
      <>
        We&apos;ve sent a detailed PDF quotation to your email{at} for your
        records.
      </>
    );
  }
  if (kind === "failed") {
    return (
      <>
        We could not email the PDF quotation{at} yet. A design consultant will
        follow up.
      </>
    );
  }
  return (
    <>
      We&apos;re sending a detailed PDF quotation to your email{at} for your
      records.
    </>
  );
}

const QuotationReady = ({
  open,
  designCode,
  unitSubtitle,
  email,
  pdfStatus,
  emailStatus,
}: Props) => {
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const shareUrl = useMemo(() => quotationShareUrl(designCode), [designCode]);
  const pdfKind = quotationJobKind(pdfStatus);
  const emailKind = quotationJobKind(emailStatus);

  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-70 overflow-y-auto hidden-scrollbar bg-[#00272d] text-white w-full! min-h-dvh"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quotation-ready-title"
      style={pageNoiseStyle(0.08)}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-30 w-full! h-full! min-h-dvh!">
        <Bg
          preserveAspectRatio="xMidYMid slice"
          className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 object-cover"
        />
      </div>

      <div className="relative mx-auto flex min-h-full w-full max-w-xl lg:max-w-6xl flex-col items-center px-4 pt-4 pb-8 sm:px-8">
        <AtelierMark />
        <h1
          id="quotation-ready-title"
          className="mt-8 text-center font-baskerville text-[28px] leading-[1.16] font-normal tracking-wider text-[#f2e9d8] sm:text-[36px]"
        >
          Your Quotation is Ready
        </h1>
        <p className="mt-4 text-center text-[13px] leading-[1.2] text-white/70 sm:text-[14px] capitalize">
          {unitSubtitle}
        </p>
        <TitleRule className="mt-4 h-px w-32.25" />

        <div className="mt-10 grid w-full! gap-5 lg:grid-cols-3">
          <CustomShape
            className="h-full w-full max-sm:max-w-[90dvw] mx-auto overflow-hidden"
            radius={{
              base: 18,
              sm: 20,
              md: 24,
            }}
            fill="transparent"
            stroke="rgba(255,255,255,0.10)"
            strokeWidth={1.33}
          >
            <div className="flex h-full flex-col items-center justify-between px-6 py-8 text-center">
              <div>
                <h2 className="font-baskerville text-[22px] leading-[1.16] tracking-wider text-[#f2e9d8]">
                  Get Your Reference Number
                </h2>
                <p className="mt-3 text-[13px] leading-[1.4] text-white/70">
                  you can use this reference number to go back to your design
                  whenever you want.
                </p>
              </div>

              <div className="mt-8 flex w-full items-center gap-2 rounded-full border border-white/20 px-4 py-2">
                <p className="min-w-0 flex-1 truncate text-left text-[13px] tracking-wide text-white">
                  {designCode}
                </p>
                <Button
                  type="button"
                  size="pill"
                  className="h-9 shrink-0 rounded-full bg-[#f2e9d8] px-4 text-[10px] tracking-[0.08em] text-[#00272d] hover:bg-[#f2e9d8]/90"
                  disabled={!designCode}
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
            className="h-full w-full max-sm:max-w-[90dvw] mx-auto overflow-hidden"
            radius={{
              base: 18,
              sm: 20,
              md: 24,
            }}
            fill="transparent"
            stroke="rgba(255,255,255,0.10)"
            strokeWidth={1.33}
          >
            <div className="flex h-full flex-col items-center justify-between px-6 py-8 text-center">
              <div>
                <h2 className="font-baskerville text-[22px] leading-[1.16] tracking-wider text-[#f2e9d8]">
                  Your PDF Quotation
                </h2>
                <p className="mt-3 text-[13px] leading-[1.4] text-white/70">
                  {pdfCopy(pdfKind)} {emailCopy(emailKind, email)}
                </p>
              </div>

              <div
                className="mt-8 flex h-13 w-full max-w-70 items-center justify-between gap-3 rounded-full border border-white/20 px-5 text-[10px] tracking-[0.12em] uppercase"
                role="status"
                aria-live="polite"
              >
                <span className="text-white/55">Status</span>
                <span className="text-[#f2e9d8]">
                  {formatQuotationJobStatus(pdfStatus)}
                </span>
              </div>
            </div>
          </CustomShape>

          <CustomShape
            className="h-full w-full max-sm:max-w-[90dvw] mx-auto overflow-hidden"
            radius={{
              base: 18,
              sm: 20,
              md: 24,
            }}
            fill="transparent"
            stroke="rgba(255,255,255,0.10)"
            strokeWidth={1.33}
          >
            <div className="flex h-full flex-col items-center justify-between px-6 py-8 text-center">
              <div>
                <h2 className="font-baskerville text-[22px] leading-[1.16] tracking-wider text-[#f2e9d8]">
                  Share Your Design
                </h2>
                <p className="mt-3 text-[13px] leading-[1.4] text-white/70">
                  Anyone with this link can walk through your design.
                </p>
              </div>

              <div className="mt-8 flex w-full items-center gap-2 rounded-full border border-white/20 px-4 py-2">
                <p className="min-w-0 flex-1 truncate text-left text-[12px] text-white/80">
                  {shareUrl}
                </p>
                <Button
                  type="button"
                  size="pill"
                  className="h-9 shrink-0 rounded-full bg-[#f2e9d8] px-4 text-[10px] tracking-[0.08em] text-[#00272d] hover:bg-[#f2e9d8]/90"
                  disabled={!designCode}
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
        <p className="mt-3 max-w-md text-center text-[13px] leading-normal text-white/70">
          A design consultant will contact you within one business day to
          confirm the design.
        </p>

        <div className="mt-6 mb-6 flex flex-wrap items-center justify-center gap-3">
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

        <p className="mt-auto pt-10 text-center text-[11px] text-white/40">
          Copyright © {new Date().getFullYear()} Atelier by REEF. All rights
          reserved. · <Link href="/terms">Terms of Service</Link> ·{" "}
          <Link href="/privacy">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
};

export default QuotationReady;
