"use client";

import { useMemo, useState } from "react";
import { Plug, Undo2 } from "lucide-react";
import SelectionRowMenu from "./selection-row-menu";
import AtelierMark from "@/components/icons/atelier-mark";
import { Button } from "@/components/ui/button";
import {
  buildReviewSections,
  reviewUnitSubtitle,
  type ReviewSurfaceLine,
} from "@/lib/configurator/review-selections";
import { cn } from "@/lib/utils";
import type { ConfiguratorSession, SelectionEntry } from "@/types/configurator";
import RemoveSelectionDialog from "./remove-selection-dialog";

const SQFT_PER_SQM = 10.7639;

const ROW_GRID =
  "md:grid md:grid-cols-[minmax(0,1fr)_minmax(10rem,1.65fr)_minmax(4.5rem,0.75fr)_minmax(5rem,0.8fr)_3rem] md:items-center";

type Props = {
  open: boolean;
  session: ConfiguratorSession;
  selections: SelectionEntry[];
  unitId?: string | null;
  onBack: () => void;
  onConfirm: () => void;
  onRemove?: (slot: string) => void;
  onEdit?: (slot: string) => void;
  actionsDisabled?: boolean;
  streamOffline?: boolean;
  onReconnect?: () => void;
};

const Dirham = ({
  className,
  size,
}: {
  className?: string;
  size: "sm" | "md" | "lg";
}) => {
  const box =
    size === "lg"
      ? "h-[17px] w-[20px]"
      : size === "md"
        ? "h-4 w-[19px]"
        : "h-[9px] w-[11px]";
  return (
    <span className={cn(box, "shrink-0 overflow-clip", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/review/dirham.svg" alt="" className="h-full w-full" />
    </span>
  );
};

const formatArea = (areaSqm?: number) => {
  if (areaSqm == null || areaSqm <= 0) return null;
  return `${Math.round(areaSqm * SQFT_PER_SQM).toLocaleString()} sq ft`;
};

const MaterialCell = ({ line }: { line: ReviewSurfaceLine }) => {
  if (!line.selected) {
    return (
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <div className="size-14 shrink-0 border border-dashed border-white bg-white/10 md:size-18.75" />
        <div className="min-w-0">
          <p className="font-medium italic text-[14px] leading-[1.16] text-white">
            Not selected
          </p>
          <p className="mt-2.5 text-[14px] leading-[1.6] text-[#ff8585]/70">
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
        <div className="relative size-14 shrink-0 overflow-clip border-[1.3px] border-white/20 md:size-18.75">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={swatch} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="size-14 shrink-0 border border-dashed border-white bg-white/10 md:size-18.75" />
      )}
      <div className="flex min-w-0 flex-col gap-2.5">
        <p className="font-medium text-[14px] leading-[1.16] text-white">
          {line.materialName}
        </p>
        {line.materialDetail ? (
          <p className="font-medium text-[12px] leading-[1.16] text-white">
            {line.materialDetail}
          </p>
        ) : null}
      </div>
    </div>
  );
};

const PriceValue = ({
  selected,
  price,
}: {
  selected: boolean;
  price: number;
}) => {
  if (!selected) {
    return (
      <p className="font-medium text-[14px] leading-[1.16] text-white">-</p>
    );
  }
  return (
    <p className="flex items-center gap-2 font-medium text-[14px] leading-[1.16] text-white">
      <Dirham size="sm" />
      {price.toLocaleString()}
    </p>
  );
};

const CellLabel = ({ children }: { children: string }) => {
  return (
    <p className="text-[10px] font-medium tracking-[0.03em] text-white/50 uppercase md:hidden">
      {children}
    </p>
  );
};

const ReviewSelections = ({
  open,
  session,
  selections,
  unitId,
  onBack,
  onConfirm,
  onRemove,
  onEdit,
  actionsDisabled,
  streamOffline,
  onReconnect,
}: Props) => {
  const { sections, total } = useMemo(
    () => buildReviewSections(session, selections),
    [session, selections],
  );

  const [pendingRemove, setPendingRemove] = useState<{
    slot: string;
    label: string;
  } | null>(null);

  const subtitle = reviewUnitSubtitle(unitId, session.levelName);
  const rowMenuDisabled = Boolean(actionsDisabled || streamOffline);

  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-55 flex flex-col bg-[#00272d] text-white"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-selections-title"
    >
      <div className="relative min-h-0 flex-1 overflow-y-auto hidden-scrollbar">
        <div className="relative z-10 mx-auto flex w-full max-w-187.25 flex-col px-4 pt-6 pb-[calc(11rem+env(safe-area-inset-bottom))] sm:px-6 md:pb-[calc(7.5rem+env(safe-area-inset-bottom))]">
          <div className="flex flex-col items-center">
            <AtelierMark />
            <h1
              id="review-selections-title"
              className="mt-8 text-center font-baskerville text-[28px] leading-[1.16] font-normal tracking-wider text-[#f2e9d8] sm:mt-10 sm:text-[36px]"
            >
              Review your selections
            </h1>
            <p className="mt-4 text-center text-[13px] leading-[1.2] text-white/70 sm:text-[14px]">
              {subtitle}
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

          <div className="mt-10 flex flex-col gap-12 sm:mt-14 sm:gap-12.5">
            {sections.map((section) => (
              <section key={section.id} className="flex flex-col gap-5.25">
                <div>
                  <h2 className="font-baskerville text-[22px] leading-[1.16] font-normal tracking-wider text-white sm:text-[24px]">
                    {section.label}
                  </h2>
                  <div className="mt-1 h-2.5 w-21.25 overflow-clip">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/review/section-rule.svg"
                      alt=""
                      className="h-full w-full"
                    />
                  </div>
                </div>

                <div className="flex min-w-0 flex-col overflow-x-auto">
                  <div
                    className={cn(
                      "hidden border-b border-white/10 md:grid",
                      ROW_GRID,
                    )}
                  >
                    {["Surface", "Material", "Area", "Price"].map((label) => (
                      <p
                        key={label}
                        className="px-2 py-3 text-[10px] font-medium tracking-[0.03em] text-white/50 uppercase"
                      >
                        {label}
                      </p>
                    ))}
                    <div />
                  </div>

                  {section.lines.map((line) => {
                    const area = line.selected
                      ? formatArea(line.areaSqm)
                      : null;
                    return (
                      <div
                        key={line.slot}
                        className={cn(
                          "border-b border-white/10 py-3 md:py-0",
                          ROW_GRID,
                        )}
                      >
                        <div className="flex items-start justify-between gap-3 px-0 md:items-center md:px-2 md:py-3">
                          <div className="min-w-0">
                            <CellLabel>Surface</CellLabel>
                            <p className="mt-1 font-medium text-[14px] leading-[1.16] text-white md:mt-0">
                              {line.surfaceLabel}
                            </p>
                          </div>
                          <div className="md:hidden">
                            <SelectionRowMenu
                              selected={line.selected}
                              disabled={rowMenuDisabled}
                              // onRemove={
                              //   onRemove ? () => onRemove(line.slot) : undefined
                              // }
                              onRemove={
                                onRemove
                                  ? () =>
                                      setPendingRemove({
                                        slot: line.slot,
                                        label: line.surfaceLabel,
                                      })
                                  : undefined
                              }
                              onEdit={
                                onEdit ? () => onEdit(line.slot) : undefined
                              }
                            />
                          </div>
                        </div>

                        <div className="mt-3 px-0 md:mt-0 md:px-2 md:py-3">
                          <CellLabel>Material</CellLabel>
                          <div className="mt-1.5 md:mt-0">
                            <MaterialCell line={line} />
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-3 md:mt-0 md:grid-cols-1 md:gap-0">
                          <div className="px-0 md:px-2 md:py-3">
                            <CellLabel>Area</CellLabel>
                            <p className="mt-1 font-medium text-[14px] leading-[1.16] text-white md:mt-0">
                              {area ?? "-"}
                            </p>
                          </div>
                          <div className="px-0 md:hidden">
                            <CellLabel>Price</CellLabel>
                            <div className="mt-1">
                              <PriceValue
                                selected={line.selected}
                                price={line.price}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="hidden px-2 py-3 md:flex md:items-center">
                          <PriceValue
                            selected={line.selected}
                            price={line.price}
                          />
                        </div>

                        <div className="hidden px-2 py-3 md:flex md:items-center md:justify-end">
                          <SelectionRowMenu
                            selected={line.selected}
                            disabled={rowMenuDisabled}
                            onRemove={
                              onRemove
                                ? () =>
                                    setPendingRemove({
                                      slot: line.slot,
                                      label: line.surfaceLabel,
                                    })
                                : undefined
                            }
                            onEdit={
                              onEdit ? () => onEdit(line.slot) : undefined
                            }
                          />
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex items-center justify-between bg-white/6 px-2 py-3">
                    <p className="font-medium text-[14px] leading-[1.16] text-white uppercase">
                      Total
                    </p>
                    <p className="flex items-center gap-2 font-baskerville text-[22px] leading-[1.16] tracking-wider text-white sm:text-[24px]">
                      <Dirham size="md" />
                      {section.subtotal.toLocaleString()}
                    </p>
                  </div>
                </div>
              </section>
            ))}
          </div>

          <aside className="mt-10 flex flex-col gap-5 border border-[#ff8585]/44 bg-[#ff8585]/6 p-5 sm:mt-18.75 sm:p-6">
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

      <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-3 pb-[max(16px,env(safe-area-inset-bottom))] sm:px-4 md:pb-10">
        <div className="pointer-events-auto flex w-full max-w-187.25 flex-col gap-3 rounded-[28px] border-[0.5px] border-white/25 bg-linear-to-l from-[rgba(173,165,153,0.2)] to-[rgba(77,69,57,0.2)] py-3 pr-3 pl-5 backdrop-blur-[25px] md:min-h-13 md:flex-row md:items-center md:justify-between md:gap-3 md:rounded-full md:py-1.5 md:pr-1.5 md:pl-6.25">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="font-baskerville text-[14px] leading-[1.16] tracking-wider text-white">
              Total :
            </p>
            <p className="flex items-center gap-0.5 font-baskerville text-[24px] leading-[1.16] tracking-wider text-white sm:text-[28px]">
              <Dirham size="lg" />
              {total.toLocaleString()}
            </p>
          </div>
          <div className="grid w-full grid-cols-1 gap-1.5 min-[420px]:grid-cols-2 md:flex md:w-auto md:grid-cols-none">
            <Button
              type="button"
              variant="pill"
              size="pill"
              className="h-10 w-full gap-2 bg-white/10 px-3.25 text-[10px] tracking-[0.03em] md:w-44.5"
              onClick={streamOffline ? onReconnect : onBack}
            >
              {streamOffline ? (
                <Plug className="size-4.5" strokeWidth={1.75} />
              ) : (
                <Undo2 className="size-4.5" strokeWidth={1.75} />
              )}
              {streamOffline ? "Reconnect" : "Back to customize"}
            </Button>
            {!streamOffline ? (
              <Button
                type="button"
                size="pill"
                className="h-10 w-full rounded-full bg-[#00272d] px-3.25 text-[10px] tracking-[0.03em] text-[#f2e9d8] hover:bg-[#00343c] md:w-44.5"
                onClick={onConfirm}
              >
                Prepare final renders
              </Button>
            ) : null}
          </div>
        </div>
      </footer>

      <RemoveSelectionDialog
        open={Boolean(pendingRemove)}
        surfaceLabel={pendingRemove?.label}
        onCancel={() => setPendingRemove(null)}
        onConfirm={() => {
          if (pendingRemove && onRemove) {
            onRemove(pendingRemove.slot);
          }
          setPendingRemove(null);
        }}
      />
    </div>
  );
};

export default ReviewSelections;
