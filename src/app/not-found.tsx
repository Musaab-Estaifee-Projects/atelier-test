import type { Metadata } from "next";
import Link from "next/link";
import AtelierMark from "@/components/icons/atelier-mark";
import { Button } from "@/components/ui/button";
import { CustomShape } from "@/components/shared/custom-shape";
import QuotationPageFrame from "@/components/pages/quotation/quotation-page-frame";

export const metadata: Metadata = {
  title: "ATELIER · Page not found",
  description: "This page could not be found.",
};

export default function NotFound() {
  return (
    <QuotationPageFrame>
      <header className="flex shrink-0 flex-col items-center">
        <AtelierMark href="/" />

        <div className="flex flex-col items-center justify-center gap-3">
          <span className="mt-12 text-[0.625rem] font-medium leading-[120%] tracking-[0.01875rem] text-white uppercase">
            Atelier by Reef
          </span>

          <h1 className="font-baskerville text-[2rem] font-normal leading-[116%] tracking-[0.1125rem] text-[#F2E9D8] capitalize md:text-[2.25rem]">
            Page not found
          </h1>

          <p className="text-center text-sm leading-[120%] text-white opacity-70">
            The page you requested is not available
          </p>

          <div className="mt-3 h-px w-32.25 overflow-clip">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/review/header-rule.svg"
              alt=""
              className="h-full w-full"
            />
          </div>
        </div>
      </header>

      <div className="mt-10 flex w-full flex-1 flex-col items-stretch gap-5 md:flex-row md:items-stretch">
        <CustomShape
          className="relative w-full overflow-hidden md:w-[66.6666%]"
          radius={{ base: 18, sm: 20, md: 24 }}
          fill="#00272D"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={1.33}
        >
          <div className="flex h-full min-h-120 w-full flex-col items-center justify-center gap-4 px-6 md:min-h-150">
            <p className="font-baskerville text-[4.5rem] leading-none tracking-wider text-[#F2E9D8]/40 md:text-[6rem]">
              404
            </p>
            <p className="max-w-80 text-center text-sm leading-[1.6] text-white/70">
              We couldn’t find this page. It may have moved, or the link may be
              incorrect.
            </p>
          </div>
        </CustomShape>

        <CustomShape
          className="relative w-full overflow-hidden md:w-[33.3333%]"
          radius={{ base: 18, sm: 20, md: 24 }}
          fill="rgba(255,255,255,0.04)"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={1}
        >
          <div className="flex h-full min-h-120 w-full md:min-h-150">
            <div className="relative flex w-full shrink-0 flex-col justify-between gap-8 p-7 lg:p-9">
              <div className="flex w-full flex-col items-center gap-4 text-center">
                <h2 className="font-baskerville text-[1.625rem] leading-[116%] capitalize text-[#F2E9D8]">
                  Where to next?
                </h2>
                <p className="text-sm leading-[1.6] text-white/70">
                  Return home, resume a quotation, or start a new experience.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="pill-solid" size="pill" asChild>
                  <Link href="/">Back to home</Link>
                </Button>
                <Button variant="pill" size="pill" asChild>
                  <Link href="/projects">Start Your Experience</Link>
                </Button>
                <Button variant="pill" size="pill" asChild>
                  <Link href="/quotation">Find a quotation</Link>
                </Button>
              </div>
            </div>
          </div>
        </CustomShape>
      </div>
    </QuotationPageFrame>
  );
}
