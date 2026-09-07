"use client";

import Link from "next/link";
import AtelierMark from "@/components/icons/atelier-mark";
import Bg from "@/components/shared/bg";
import { CustomShape } from "@/components/shared/custom-shape";
import { Button } from "@/components/ui/button";
import { pageNoiseStyle } from "@/lib/ui/page-noise";
import CreateNewQuotationDialog, {
  NewQuotationMode,
} from "@/components/pages/reference-number/create-new-quotation-dialog";
import { useState } from "react";
import { useRouter } from "next/navigation";

const EXPIRED: boolean = true;

const CONFIGURATOR_KEEP_HREF =
  "/configurator?from=expired&mode=keep&destination=summary";
const CONFIGURATOR_EDIT_HREF = "/configurator?from=expired&mode=edit";

const ReferenceNumberStatus = () => {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleContinue = (mode: NewQuotationMode) => {
    setDialogOpen(false);
    router.push(
      mode === "keep" ? CONFIGURATOR_KEEP_HREF : CONFIGURATOR_EDIT_HREF,
    );
  };

  return (
    <main
      className="relative min-h-dvh! bg-[#00272d] text-white"
      style={{
        ...pageNoiseStyle(0.11),
      }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
        <Bg
          preserveAspectRatio="xMidYMid slice"
          className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 object-cover"
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh w-full flex-col items-center gap-8 px-5 pt-6 pb-6 sm:px-8 sm:pt-8 sm:pb-8 lg:px-10 lg:pt-6 lg:pb-8">
        <header className="flex shrink-0 flex-col items-center">
          <AtelierMark href="/" />

          <div className="flex flex-col items-center justify-center gap-3">
            <span className="mt-12 text-white text-[0.625rem] font-medium leading-[120%] tracking-[0.01875rem] uppercase">
              Welcome Back
            </span>

            <h1 className="font-baskerville text-[2rem] md:text-[2.25rem] leading-[116%] font-normal tracking-[0.1125rem] text-[#F2E9D8] capitalize">
              Your Custom Design
            </h1>

            <p className="text-white text-sm leading-[120%] opacity-70 text-center">
              REEF 997 - 2 Bedrooms - Type A (1,200 Sq Ft)
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
              {/* Right column: room image fills full height of the shape */}
              <div className="relative min-h-0 flex-1 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/quotation-image.png"
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover p-px"
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
              <div className="relative flex flex-col justify-between p-7 lg:p-9 gap-8 w-full shrink-0">
                <div className="relative min-h-0 flex-1 overflow-hidden">
                  <div className="w-full flex flex-col items-center justify-center gap-8">
                    <h2 className="text-[#F2E9D8] font-baskerville text-[1.625rem] leading-[116%] capitalize">
                      Your quotation
                    </h2>

                    <div className="flex flex-col w-full">
                      <div className="flex md:flex-col md:items-start lg:items-center lg:flex-row flex-wrap items-center justify-between gap-2 px-2 py-3">
                        <h3 className="text-white text-[0.625rem] uppercase opacity-50 font-medium leading-[120%]">
                          Reference
                        </h3>

                        <span className="text-white text-sm uppercase font-medium leading-[116%]">
                          Q-2026-04821
                        </span>
                      </div>

                      <hr className="border border-white/10" />

                      <div className="flex md:flex-col md:items-start lg:items-center lg:flex-row flex-wrap items-center justify-between gap-2 px-2 py-3">
                        <h3 className="text-white text-[0.625rem] uppercase opacity-50 font-medium leading-[120%]">
                          Issued
                        </h3>

                        <span className="text-white text-sm uppercase font-medium leading-[116%]">
                          2 AUG 2026
                        </span>
                      </div>

                      <hr className="border border-white/10" />

                      <div className="flex md:flex-col md:items-start lg:items-center lg:flex-row flex-wrap items-center justify-between gap-2 px-2 py-3">
                        <h3
                          className={`${EXPIRED ? "text-[#FF8585]" : "text-white opacity-50"} text-[0.625rem] tracking-[0.01875rem] uppercase font-medium leading-[120%]`}
                        >
                          Valid until
                        </h3>

                        <span
                          className={`${EXPIRED ? "text-[#FF8585] tracking-[0.01875rem] flex items-center justify-start flex-wrap gap-2" : "text-white"} text-sm uppercase font-medium leading-[116%]`}
                        >
                          {EXPIRED && (
                            <span className="bg-[rgba(255,133,133,0.10)] rounded-[5.5rem] px-[0.81rem] h-7 text-[#FF8585] text-sm italic capitalize leading-3 flex items-center justify-center">
                              Expired
                            </span>
                          )}
                          9 AUG 2026
                        </span>
                      </div>

                      <hr className="border border-white/10" />

                      <div className="flex md:flex-col md:items-start lg:items-center lg:flex-row flex-wrap items-center justify-between gap-2 px-2 py-3">
                        <h3 className="text-white text-[0.625rem] uppercase opacity-50 font-medium leading-[120%]">
                          Total then
                        </h3>

                        <span className="text-white text-sm uppercase font-medium leading-[116%] flex items-center justify-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src="/images/review/dirham.svg"
                            alt=""
                            className="w-2.75 h-[0.57869rem] mt-0.5"
                          />
                          15,350
                        </span>
                      </div>

                      <hr className="border border-white/10" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    {!EXPIRED ? (
                      <>
                        <Button
                          type="button"
                          variant="pill-solid"
                          size="pill"
                          // className="mt-1 h-auto w-fit rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-medium tracking-[0.06em] text-[#f2e9d8] hover:bg-white/20 hover:text-white"
                        >
                          Download My Quotation
                        </Button>

                        <Button
                          type="button"
                          variant="pill"
                          size="pill"
                          // className="mt-1 h-auto w-fit rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-medium tracking-[0.06em] text-[#f2e9d8] hover:bg-white/20 hover:text-white"
                        >
                          Walk in 3D
                        </Button>

                        <Button
                          type="button"
                          variant="pill"
                          size="pill"
                          // className="mt-1 h-auto w-fit rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-medium tracking-[0.06em] text-[#f2e9d8] hover:bg-white/20 hover:text-white"
                        >
                          Edit My choices
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="pill"
                        size="pill"
                        onClick={() => setDialogOpen(true)}
                        // className="mt-1 h-auto w-fit rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-medium tracking-[0.06em] text-[#f2e9d8] hover:bg-white/20 hover:text-white"
                      >
                        Create new quotation
                      </Button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 items-center justify-center">
                    <span className="text-white text-[0.8125rem] opacity-40 leading-normal">
                      Need Help?
                    </span>

                    <Link
                      href="mailto:clientexperience@atelier.ae"
                      className="text-[0.8125rem] text-white hover:text-[#f2e9d8] underline underline-offset-2 leading-normal"
                    >
                      clientexperience@atelier.ae
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </CustomShape>
        </div>

        <div className="mt-2 mb-4! flex shrink-0 flex-col gap-2 items-center">
          <p className="text-center text-[12px] leading-[1.2] text-white underline underline-offset-8 decoration-white/54">
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

        <footer className="text-white text-sm leading-normal opacity-40">
          Copyright © 2026 Atelier by REEF. All rights reserved. • Terms of
          Service • Privacy Policy
        </footer>
      </div>

      <CreateNewQuotationDialog
        open={dialogOpen}
        onCancel={() => setDialogOpen(false)}
        onContinue={handleContinue}
      />
    </main>
  );
};

export default ReferenceNumberStatus;
