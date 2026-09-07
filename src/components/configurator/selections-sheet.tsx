"use client";

import { useMemo, useState } from "react";
import OverlayDialog from "@/components/ui/overlay-dialog";
import { CustomShape } from "@/components/shared/custom-shape";
import { materialThumb } from "@/lib/configurator/chrome";
import { buildSelectedItemSections } from "@/lib/configurator/review-selections";
import type { ConfiguratorSession, SelectionEntry } from "@/types/configurator";
import RemoveSelectionDialog from "./remove-selection-dialog";
import SelectionRowMenu from "./selection-row-menu";

type Props = {
  open: boolean;
  selections: SelectionEntry[];
  session?: ConfiguratorSession;
  slotLabels?: Record<string, string>;
  onClose: () => void;
  onRemove?: (slot: string) => void;
  onEdit?: (slot: string) => void;
  viewOnly?: boolean;
};

const fallbackSwatchSrc = (fallback?: "wood" | "marble") =>
  fallback === "marble"
    ? "/images/review/swatch-marble.png"
    : fallback
      ? "/images/review/swatch-wood.png"
      : undefined;

const isSelectionRowMenuEvent = (event: Event) => {
  const target = event.target as HTMLElement | null;
  return Boolean(target?.closest?.("[data-selection-row-menu]"));
};

const SelectionsSheet = ({
  open,
  selections,
  session,
  slotLabels = {},
  onClose,
  onRemove,
  onEdit,
  viewOnly,
}: Props) => {
  const sections = useMemo(
    () => buildSelectedItemSections(session, selections, slotLabels),
    [session, selections, slotLabels],
  );

  const [pendingRemove, setPendingRemove] = useState<{
    slot: string;
    label: string;
  } | null>(null);

  return (
    <>
      <OverlayDialog
        open={open}
        titleHidden
        onOpenChange={(next) => {
          if (!next) onClose();
        }}
        title="Selected Items"
        blur={false}
        overlayClassName="z-52"
        contentClassName="z-52 w-full flex items-center justify-center"
        onPointerDownOutside={(e) => {
          if (isSelectionRowMenuEvent(e)) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (isSelectionRowMenuEvent(e)) e.preventDefault();
        }}
      >
        <div className="relative w-full max-w-[90%] sm:max-w-153.5 flex items-center justify-center overflow-hidden">
          <CustomShape
            className="h-auto w-full max-w-153.5!"
            radius={{
              base: 20,
              sm: 26,
              md: 32,
            }}
            stroke="rgba(255,255,255,0.10)"
            strokeWidth={1}
          >
            <div className="relative z-10 flex w-full flex-col items-center gap-5 px-5 py-6 sm:gap-6 sm:px-10 sm:py-10">
              <h2 className="w-full text-center font-baskerville text-[1.25rem] font-normal leading-[1.16] capitalize text-[#f2e9d8] sm:text-[1.625rem]">
                Selected Items
              </h2>

              {sections.length === 0 ? (
                <p className="w-full text-center text-sm leading-[1.6] text-white/70">
                  No finishes selected yet.
                </p>
              ) : (
                <div className="flex max-h-[min(28.5rem,calc(90dvh-9rem))] w-full flex-col gap-5 overflow-y-auto pr-2 scrollbar-thin sm:gap-6 [scrollbar-color:rgba(255,255,255,0.2)_rgba(255,255,255,0.05)] [&::-webkit-scrollbar]:w-0.5 [&::-webkit-scrollbar-track]:bg-white/5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20">
                  {sections.map((section) => (
                    <section
                      key={section.id}
                      className="flex w-full flex-col items-start gap-2"
                    >
                      <h3 className="w-full font-sans text-[11px] font-medium uppercase leading-[1.16] tracking-[0.55px] text-white">
                        {section.label}
                      </h3>
                      {section.lines.map((line) => {
                        const thumb = materialThumb(
                          line.slot,
                          line.thumbnailUrl ??
                            fallbackSwatchSrc(line.fallbackSwatch),
                        );
                        return (
                          <div
                            key={line.slot}
                            className="flex w-full items-center gap-1.75 rounded-full bg-white/5 py-1 pr-3 pl-1 sm:pr-4"
                          >
                            <span className="relative size-11 shrink-0 overflow-clip rounded-full sm:size-13">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={thumb}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            </span>
                            <div className="flex min-w-0 flex-1 flex-col items-start justify-center gap-1.75">
                              <p className="w-full truncate font-sans text-[10px] font-medium uppercase leading-[1.2] tracking-[0.3px] text-white/50">
                                {line.surfaceLabel}
                              </p>
                              <p className="w-full truncate font-sans text-[12px] font-medium leading-[1.16] text-white/80">
                                {line.materialName ?? "Selected"}
                              </p>
                            </div>
                            {!viewOnly ? (
                              <SelectionRowMenu
                                selected={line.selected}
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
                                  onEdit
                                    ? () => {
                                        onClose();
                                        onEdit(line.slot);
                                      }
                                    : undefined
                                }
                              />
                            ) : null}
                          </div>
                        );
                      })}
                    </section>
                  ))}
                </div>
              )}
            </div>
          </CustomShape>
        </div>
      </OverlayDialog>

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
    </>
  );
};

export default SelectionsSheet;
