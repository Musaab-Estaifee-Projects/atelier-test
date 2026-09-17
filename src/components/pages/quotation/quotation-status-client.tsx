"use client";

import { useState } from "react";
import Link from "next/link";
import { CustomShape } from "@/components/shared/custom-shape";
import { Button } from "@/components/ui/button";
import CreateNewQuotationDialog from "@/components/pages/quotation/create-new-quotation-dialog";
import QuotationPageFrame, {
  QuotationPageHeader,
} from "@/components/pages/quotation/quotation-page-frame";
import {
  formatQuotationDate,
  formatQuotationTotal,
  quotationResidenceSubtitle,
} from "@/lib/quotation/display";
import type { SavedDesignData } from "@/services/get-saved-design.service";

type Props = {
  data: SavedDesignData;
};

const QuotationStatusClient = ({ data }: Props) => {
  const expired = Boolean(data.quotation.is_expired);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const previewSrc =
    !previewFailed && data.preview_url?.trim()
      ? data.preview_url
      : "/images/quotation-image.png";

  return (
    <QuotationPageFrame>
      <QuotationPageHeader
        subtitle={quotationResidenceSubtitle(data.property)}
      />

      <div className="mt-10 flex w-full flex-1 flex-col items-stretch gap-5 md:flex-row md:items-stretch">
        <CustomShape
          className="relative w-full overflow-hidden md:w-[66.6666%]"
          radius={{
            base: 18,
            sm: 20,
            md: 24,
          }}
          fill="#00272D"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={1.33}
        >
          <div className="flex h-full min-h-120 w-full md:min-h-150">
            <div className="relative min-h-0 flex-1 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewSrc}
                alt=""
                className="absolute inset-0 h-full w-full object-cover p-px"
                onError={() => setPreviewFailed(true)}
              />
            </div>
          </div>
        </CustomShape>

        <CustomShape
          className="relative w-full overflow-hidden md:w-[33.3333%]"
          radius={{
            base: 18,
            sm: 20,
            md: 24,
          }}
          fill="rgba(255,255,255,0.04)"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={1}
        >
          <div className="flex h-full min-h-120 w-full md:min-h-150">
            <div className="relative flex w-full shrink-0 flex-col justify-between gap-8 p-7 lg:p-9">
              <div className="relative min-h-0 flex-1 overflow-hidden">
                <div className="flex w-full flex-col items-center justify-center gap-8">
                  <h2 className="font-baskerville text-[1.625rem] leading-[116%] capitalize text-[#F2E9D8]">
                    Your quotation
                  </h2>

                  <div className="flex w-full flex-col">
                    <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-3 md:flex-col md:items-start lg:flex-row lg:items-center">
                      <h3 className="text-[0.625rem] font-medium leading-[120%] text-white uppercase opacity-50">
                        Reference
                      </h3>
                      <span className="text-sm font-medium leading-[116%] text-white uppercase">
                        {data.design_code}
                      </span>
                    </div>

                    <hr className="border border-white/10" />

                    <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-3 md:flex-col md:items-start lg:flex-row lg:items-center">
                      <h3 className="text-[0.625rem] font-medium leading-[120%] text-white uppercase opacity-50">
                        Issued
                      </h3>
                      <span className="text-sm font-medium leading-[116%] text-white uppercase">
                        {formatQuotationDate(data.quotation.priced_at)}
                      </span>
                    </div>

                    <hr className="border border-white/10" />

                    <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-3 md:flex-col md:items-start lg:flex-row lg:items-center">
                      <h3
                        className={`${expired ? "text-[#FF8585]" : "text-white opacity-50"} text-[0.625rem] font-medium leading-[120%] tracking-[0.01875rem] uppercase`}
                      >
                        Valid until
                      </h3>
                      <span
                        className={`${expired ? "text-[#FF8585] tracking-[0.01875rem] flex flex-wrap items-center justify-start gap-2" : "text-white"} text-sm font-medium leading-[116%] uppercase`}
                      >
                        {expired ? (
                          <span className="flex h-7 items-center justify-center rounded-[5.5rem] bg-[rgba(255,133,133,0.10)] px-[0.81rem] text-sm leading-3 text-[#FF8585] italic capitalize">
                            Expired
                          </span>
                        ) : null}
                        {formatQuotationDate(data.quotation.expires_at)}
                      </span>
                    </div>

                    <hr className="border border-white/10" />

                    <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-3 md:flex-col md:items-start lg:flex-row lg:items-center">
                      <h3 className="text-[0.625rem] font-medium leading-[120%] text-white uppercase opacity-50">
                        Total then
                      </h3>
                      <span className="flex items-center justify-center gap-2 text-sm font-medium leading-[116%] text-white uppercase">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/review/dirham.svg"
                          alt=""
                          className="mt-0.5 h-[0.57869rem] w-2.75"
                        />
                        {formatQuotationTotal(data.quotation.total_amount)}
                      </span>
                    </div>

                    <hr className="border border-white/10" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  {!expired ? (
                    <>
                      <Button type="button" variant="pill-solid" size="pill">
                        Download My Quotation
                      </Button>
                      <Button type="button" variant="pill" size="pill">
                        Walk in 3D
                      </Button>
                      <Button type="button" variant="pill" size="pill">
                        Edit My choices
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="pill"
                      size="pill"
                      onClick={() => setDialogOpen(true)}
                    >
                      Create new quotation
                    </Button>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-1">
                  <span className="text-[0.8125rem] leading-normal text-white opacity-40">
                    Need Help?
                  </span>
                  <Link
                    href="mailto:clientexperience@atelier.ae"
                    className="text-[0.8125rem] leading-normal text-white underline underline-offset-2 hover:text-[#f2e9d8]"
                  >
                    clientexperience@atelier.ae
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </CustomShape>
      </div>

      <div className="mt-2 mb-4! flex shrink-0 flex-col items-center gap-2">
        <p className="text-center text-[12px] leading-[1.2] text-white underline decoration-white/54 underline-offset-8">
          Start something new instead ?
        </p>
        <Button
          type="button"
          variant="pill-soft"
          size="pill-lg"
          className="mt-4 w-full"
          asChild
        >
          <Link href="/projects">Start Your Experience</Link>
        </Button>
      </div>

      <footer className="text-sm leading-normal text-white opacity-40">
        Copyright © {new Date().getUTCFullYear()} Atelier by REEF. All rights
        reserved. • Terms of Service • Privacy Policy
      </footer>

      <CreateNewQuotationDialog
        open={dialogOpen}
        onCancel={() => setDialogOpen(false)}
        onContinue={() => setDialogOpen(false)}
      />
    </QuotationPageFrame>
  );
};

export default QuotationStatusClient;
