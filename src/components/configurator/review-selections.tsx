"use client";

import { useMemo } from "react";
import AtelierMark from "@/components/icons/atelier-mark";
import { Button } from "@/components/ui/button";
import {
  buildReviewSections,
  reviewUnitSubtitle,
  type ReviewSurfaceLine,
} from "@/lib/configurator/review-selections";
import type { ConfiguratorSession, SelectionEntry } from "@/types/configurator";
import CustomHeaderStyle from "../icons/configurator/custom-header-style";

type Props = {
  open: boolean;
  session: ConfiguratorSession;
  selections: SelectionEntry[];
  unitId?: string | null;
  onBack: () => void;
  onConfirm: () => void;
};

function Dirham({
  className,
  size,
}: {
  className?: string;
  size: "sm" | "lg";
}) {
  const box = size === "lg" ? "h-[25px] w-[29px]" : "h-[16px] w-[19px]";
  return (
    <span className={`${box} shrink-0 overflow-clip ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/review/dirham.svg" alt="" className="h-full w-full" />
    </span>
  );
}

function MaterialCell({ line }: { line: ReviewSurfaceLine }) {
  if (!line.selected) {
    return (
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <div className="size-[56px] shrink-0 border border-dashed border-white bg-white/10 sm:size-[75px]" />
        <div className="min-w-0">
          <p className="font-medium italic text-[14px] leading-[1.16] text-white">
            Not selected
          </p>
          <p className="mt-1.5 text-[14px] leading-[1.6] text-[#ff8585]/70">
            Standard finish
          </p>
        </div>
      </div>
    );
  }

  const swatch =
    line.thumbnailUrl ??
    (line.fallbackSwatch === "marble"
      ? "/images/review/swatch-marble.png"
      : line.fallbackSwatch
        ? "/images/review/swatch-wood.png"
        : undefined);

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2.5">
      {swatch ? (
        <div className="relative size-[56px] shrink-0 overflow-clip border-[1.3px] border-white/20 sm:size-[75px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={swatch} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="size-[56px] shrink-0 border border-dashed border-white bg-white/10 sm:size-[75px]" />
      )}
      <div className="min-w-0">
        <p className="font-medium text-[14px] leading-[1.16] text-white">
          {line.materialName}
        </p>
        {line.materialDetail ? (
          <p className="mt-1.5 font-medium text-[12px] leading-[1.16] text-white">
            {line.materialDetail}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function ReviewSelections({
  open,
  session,
  selections,
  unitId,
  onBack,
  onConfirm,
}: Props) {
  const { sections, total } = useMemo(
    () => buildReviewSections(session, selections),
    [session, selections],
  );
  const subtitle = reviewUnitSubtitle(unitId, session.levelName);

  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-55 flex flex-col bg-[#00272d] text-white"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-selections-title"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0! left-[16%] h-[min(382px,42vw)] overflow-hidden opacity-45">
        {/* <img
          src="/images/review/header-bg.png"
          alt=""
          className="h-full w-full object-cover object-[center_top]"
        /> */}
        <CustomHeaderStyle className="h-full w-full object-cover object-[center_top]" />
      </div>

      <div className="relative w-full hidden-scrollbar overflow-y-auto">
        <div className="relative z-10 mx-auto flex w-full flex-1 flex-col px-4 pt-6 pb-65 sm:pb-35 sm:pt-6 max-w-187.25">
          <div className="flex flex-col items-center">
            <AtelierMark />
            <h1
              id="review-selections-title"
              className="mt-8 text-center font-baskerville text-[28px] leading-[1.16] font-normal tracking-[0.05em] text-[#f2e9d8] sm:mt-10 sm:text-[36px]"
            >
              Review your selections
            </h1>
            <p className="mt-4 text-center text-[13px] leading-[1.2] text-white/70 sm:text-[14px]">
              {subtitle}
            </p>
            <div className="mt-3 h-px w-[129px] overflow-clip">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/review/header-rule.svg"
                alt=""
                className="h-full w-full"
              />
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-12 sm:mt-14 sm:gap-[52px]">
            {sections.map((section) => (
              <section key={section.id}>
                <div className="mb-5">
                  <h2 className="font-baskerville text-[22px] leading-[1.16] font-normal text-white sm:text-[24px] sm:tracking-[0.05em]">
                    {section.label}
                  </h2>
                  <div className="mt-1 h-[10px] w-[85px] overflow-clip">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/review/section-rule.svg"
                      alt=""
                      className="h-full w-full"
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="hidden border-b border-white/10 sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)]">
                    <p className="px-2 py-3 text-[10px] font-medium tracking-[0.03em] text-white/50 uppercase">
                      Surface
                    </p>
                    <p className="px-2 py-3 text-[10px] font-medium tracking-[0.03em] text-white/50 uppercase">
                      Material
                    </p>
                  </div>

                  {section.lines.map((line) => (
                    <div
                      key={line.slot}
                      className="grid grid-cols-1 gap-2 border-b border-white/10 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)] sm:items-center sm:gap-0 sm:py-0"
                    >
                      <p className="px-0 text-[10px] font-medium tracking-[0.03em] text-white/50 uppercase sm:hidden">
                        Surface
                      </p>
                      <p className="px-0 font-medium text-[14px] leading-[1.16] text-white sm:px-2 sm:py-3">
                        {line.surfaceLabel}
                      </p>
                      <p className="px-0 pt-1 text-[10px] font-medium tracking-[0.03em] text-white/50 uppercase sm:hidden">
                        Material
                      </p>
                      <div className="px-0 sm:px-2 sm:py-3">
                        <MaterialCell line={line} />
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between bg-white/[0.06] px-2 py-3">
                    <p className="font-medium text-[14px] leading-[1.16] text-white uppercase">
                      Total
                    </p>
                    <p className="flex items-center gap-2 font-baskerville text-[22px] leading-[1.16] tracking-[0.05em] text-white sm:text-[24px]">
                      <Dirham size="sm" />
                      {section.subtotal.toLocaleString()}
                    </p>
                  </div>
                </div>
              </section>
            ))}
          </div>

          <aside className="mt-10 flex flex-col gap-5 border border-[#ff8585]/44 bg-[#ff8585]/6 p-5 sm:mt-14 sm:p-6">
            <p className="font-medium text-[14px] leading-[1.16] text-white uppercase">
              Note
            </p>
            <p className="text-[14px] leading-[1.6] text-[#ff8585]/70">
              The items that were not chosen will be quoted as the standard
              finish, at no extra cost.
            </p>
            <p className="text-[12px] leading-[1.6] text-white/50 italic">
              T &amp; C apply
            </p>
          </aside>
        </div>
      </div>

      <footer className="absolute inset-x-0 bottom-0 z-20 border-t border-white/10 bg-[#00272d]/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-187.25 flex-col gap-4 px-4 py-4 sm:h-24 sm:flex-row sm:items-center sm:justify-between sm:px-0 sm:py-0">
          <div>
            <p className="text-[10px] font-medium tracking-[0.03em] text-white/50 uppercase">
              Estimated, before VAT
            </p>
            <p className="mt-1.5 flex items-center gap-3 font-baskerville text-[28px] leading-[1.16] tracking-[0.05em] text-white sm:text-[37px]">
              <Dirham size="lg" />
              {total.toLocaleString()}
            </p>
          </div>
          <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:gap-2.5">
            <Button
              type="button"
              variant="pill-outline"
              size="pill"
              className="w-full sm:w-[204px]"
              onClick={onBack}
            >
              Back to customize
            </Button>
            <Button
              type="button"
              variant="pill-solid"
              size="pill"
              className="w-full sm:w-[204px]"
              onClick={onConfirm}
            >
              Confirm My Selection
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
