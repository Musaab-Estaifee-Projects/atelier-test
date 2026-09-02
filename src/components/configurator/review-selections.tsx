"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EllipsisVertical, Undo2 } from "lucide-react";
import AtelierMark from "@/components/icons/atelier-mark";
import { Button } from "@/components/ui/button";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
import {
  buildReviewSections,
  reviewUnitSubtitle,
  type ReviewSurfaceLine,
} from "@/lib/configurator/review-selections";
import { cn } from "@/lib/utils";
import type { ConfiguratorSession, SelectionEntry } from "@/types/configurator";

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
};

function Dirham({
  className,
  size,
}: {
  className?: string;
  size: "sm" | "md" | "lg";
}) {
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
}

function formatArea(areaSqm?: number) {
  if (areaSqm == null || areaSqm <= 0) return null;
  return `${Math.round(areaSqm * SQFT_PER_SQM).toLocaleString()} sq ft`;
}

function MaterialCell({ line }: { line: ReviewSurfaceLine }) {
  if (!line.selected) {
    return (
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <div className="size-14 shrink-0 border border-dashed border-white bg-white/10 md:size-[75px]" />
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
        <div className="relative size-14 shrink-0 overflow-clip border-[1.3px] border-white/20 md:size-[75px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={swatch} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="size-14 shrink-0 border border-dashed border-white bg-white/10 md:size-[75px]" />
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
}

// function RowMenu({
//   selected,
//   onRemove,
//   onEdit,
// }: {
//   selected: boolean;
//   onRemove?: () => void;
//   onEdit?: () => void;
// }) {
//   const [open, setOpen] = useState(false);
//   if (!onRemove && !onEdit) return null;

//   return (
//     <Popover open={open} onOpenChange={setOpen}>
//       <PopoverTrigger asChild>
//         <button
//           type="button"
//           aria-label="Row actions"
//           className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 p-1 text-white transition hover:bg-white/20"
//         >
//           <EllipsisVertical className="size-[18px]" strokeWidth={1.75} />
//         </button>
//       </PopoverTrigger>
//       <PopoverContent
//         align="end"
//         side="bottom"
//         sideOffset={6}
//         className="z-[70] w-[102px] gap-[5px] rounded-none border-white/5 bg-[#001f24] p-[5px] text-[12px] text-white/70 shadow-none ring-0"
//       >
//         {onRemove ? (
//           <button
//             type="button"
//             disabled={!selected}
//             className="w-full bg-white/5 p-2.5 text-left leading-[1.2] text-white/70 transition hover:bg-white/10 disabled:opacity-40"
//             onClick={() => {
//               onRemove();
//               setOpen(false);
//             }}
//           >
//             Remove
//           </button>
//         ) : null}
//         {onEdit ? (
//           <button
//             type="button"
//             className="w-full p-2.5 text-left leading-[1.2] text-white/70 transition hover:bg-white/5"
//             onClick={() => {
//               onEdit();
//               setOpen(false);
//             }}
//           >
//             Edit
//           </button>
//         ) : null}
//       </PopoverContent>
//     </Popover>
//   );
// }

// function RowMenu({
//   selected,
//   onRemove,
//   onEdit,
// }: {
//   selected: boolean;
//   onRemove?: () => void;
//   onEdit?: () => void;
// }) {
//   const [open, setOpen] = useState(false);
//   const [pos, setPos] = useState({ top: 0, left: 0 });
//   const buttonRef = useRef<HTMLButtonElement>(null);
//   const menuRef = useRef<HTMLDivElement>(null);

//   const updatePosition = () => {
//     const btn = buttonRef.current;
//     if (!btn) return;
//     const rect = btn.getBoundingClientRect();
//     setPos({
//       top: rect.bottom + 6,
//       left: rect.right - 102, // menu width = 102px, align to the right of the button
//     });
//   };

//   useEffect(() => {
//     if (!open) return;

//     updatePosition();

//     const handleClick = (e: MouseEvent) => {
//       if (
//         menuRef.current &&
//         !menuRef.current.contains(e.target as Node) &&
//         buttonRef.current &&
//         !buttonRef.current.contains(e.target as Node)
//       ) {
//         setOpen(false);
//       }
//     };

//     const handleScroll = () => setOpen(false);

//     document.addEventListener("mousedown", handleClick);
//     window.addEventListener("scroll", handleScroll, true);
//     window.addEventListener("resize", handleScroll);

//     return () => {
//       document.removeEventListener("mousedown", handleClick);
//       window.removeEventListener("scroll", handleScroll, true);
//       window.removeEventListener("resize", handleScroll);
//     };
//   }, [open]);

//   if (!onRemove && !onEdit) return null;

//   return (
//     <>
//       <button
//         ref={buttonRef}
//         type="button"
//         aria-label="Row actions"
//         onClick={() => {
//           if (!open) updatePosition();
//           setOpen((prev) => !prev);
//         }}
//         className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 p-1 text-white transition hover:bg-white/20"
//       >
//         <EllipsisVertical className="size-[18px]" strokeWidth={1.75} />
//       </button>

//       {open && (
//         <div
//           ref={menuRef}
//           style={{
//             position: "fixed",
//             top: pos.top,
//             left: Math.max(8, pos.left), // prevent going off the left edge
//             zIndex: 100,
//           }}
//           className="w-[102px] rounded-none border border-white/5 bg-[#001f24] p-[5px] text-[12px] text-white/70 shadow-lg"
//         >
//           {onRemove && (
//             <button
//               type="button"
//               disabled={!selected}
//               className="w-full bg-white/5 p-2.5 text-left leading-[1.2] text-white/70 transition hover:bg-white/10 disabled:opacity-40"
//               onClick={() => {
//                 onRemove();
//                 setOpen(false);
//               }}
//             >
//               Remove
//             </button>
//           )}

//           {onEdit && (
//             <button
//               type="button"
//               className="w-full p-2.5 text-left leading-[1.2] text-white/70 transition hover:bg-white/5"
//               onClick={() => {
//                 onEdit();
//                 setOpen(false);
//               }}
//             >
//               Edit
//             </button>
//           )}
//         </div>
//       )}
//     </>
//   );
// }

function RowMenu({
  selected,
  onRemove,
  onEdit,
}: {
  selected: boolean;
  onRemove?: () => void;
  onEdit?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setPos({
      top: rect.bottom + 6,
      left: rect.right - 102,
    });
  };

  useEffect(() => {
    if (!open) return;

    updatePosition();

    const handleClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    // Keep the menu attached to the button while scrolling
    const handleScroll = () => updatePosition();

    document.addEventListener("mousedown", handleClick);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [open]);

  if (!onRemove && !onEdit) return null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Row actions"
        onClick={() => {
          if (!open) updatePosition();
          setOpen((prev) => !prev);
        }}
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 p-1 text-white transition hover:bg-white/20"
      >
        <EllipsisVertical className="size-[18px]" strokeWidth={1.75} />
      </button>

      {open && (
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: pos.top,
            left: Math.max(8, pos.left),
            zIndex: 100,
          }}
          className="w-[102px] rounded-none border border-white/5 bg-[#001f24] p-[5px] text-[12px] text-white/70 shadow-lg"
        >
          {onRemove && (
            <button
              type="button"
              disabled={!selected}
              className="w-full bg-white/5 p-2.5 text-left leading-[1.2] text-white/70 transition hover:bg-white/10 disabled:opacity-40"
              onClick={() => {
                onRemove();
                setOpen(false);
              }}
            >
              Remove
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              className="w-full p-2.5 text-left leading-[1.2] text-white/70 transition hover:bg-white/5"
              onClick={() => {
                onEdit();
                setOpen(false);
              }}
            >
              Edit
            </button>
          )}
        </div>
      )}
    </>
  );
}

function PriceValue({ selected, price }: { selected: boolean; price: number }) {
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
}

function CellLabel({ children }: { children: string }) {
  return (
    <p className="text-[10px] font-medium tracking-[0.03em] text-white/50 uppercase md:hidden">
      {children}
    </p>
  );
}

export default function ReviewSelections({
  open,
  session,
  selections,
  unitId,
  onBack,
  onConfirm,
  onRemove,
  onEdit,
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
      <div className="relative min-h-0 flex-1 overflow-y-auto hidden-scrollbar">
        <div className="relative z-10 mx-auto flex w-full max-w-187.25 flex-col px-4 pt-6 pb-[calc(11rem+env(safe-area-inset-bottom))] sm:px-6 md:pb-[calc(7.5rem+env(safe-area-inset-bottom))]">
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

          <div className="mt-10 flex flex-col gap-12 sm:mt-14 sm:gap-[50px]">
            {sections.map((section) => (
              <section key={section.id} className="flex flex-col gap-[21px]">
                <div>
                  <h2 className="font-baskerville text-[22px] leading-[1.16] font-normal tracking-[0.05em] text-white sm:text-[24px]">
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
                            <RowMenu
                              selected={line.selected}
                              onRemove={
                                onRemove ? () => onRemove(line.slot) : undefined
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
                          <RowMenu
                            selected={line.selected}
                            onRemove={
                              onRemove ? () => onRemove(line.slot) : undefined
                            }
                            onEdit={
                              onEdit ? () => onEdit(line.slot) : undefined
                            }
                          />
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex items-center justify-between bg-white/[0.06] px-2 py-3">
                    <p className="font-medium text-[14px] leading-[1.16] text-white uppercase">
                      Total
                    </p>
                    <p className="flex items-center gap-2 font-baskerville text-[22px] leading-[1.16] tracking-[0.05em] text-white sm:text-[24px]">
                      <Dirham size="md" />
                      {section.subtotal.toLocaleString()}
                    </p>
                  </div>
                </div>
              </section>
            ))}
          </div>

          <aside className="mt-10 flex flex-col gap-5 border border-[#ff8585]/44 bg-[#ff8585]/6 p-5 sm:mt-[75px] sm:p-6">
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
        <div className="pointer-events-auto flex w-full max-w-187.25 flex-col gap-3 rounded-[28px] border-[0.5px] border-white/25 bg-linear-to-l from-[rgba(173,165,153,0.2)] to-[rgba(77,69,57,0.2)] py-3 pr-3 pl-5 backdrop-blur-[25px] md:min-h-[52px] md:flex-row md:items-center md:justify-between md:gap-3 md:rounded-full md:py-1.5 md:pr-1.5 md:pl-[25px]">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="font-baskerville text-[14px] leading-[1.16] tracking-[0.05em] text-white">
              Total :
            </p>
            <p className="flex items-center gap-0.5 font-baskerville text-[24px] leading-[1.16] tracking-[0.05em] text-white sm:text-[28px]">
              <Dirham size="lg" />
              {total.toLocaleString()}
            </p>
          </div>
          <div className="grid w-full grid-cols-1 gap-1.5 min-[420px]:grid-cols-2 md:flex md:w-auto md:grid-cols-none">
            <Button
              type="button"
              variant="pill"
              size="pill"
              className="h-10 w-full gap-2 bg-white/10 px-[13px] text-[10px] tracking-[0.03em] md:w-[178px]"
              onClick={onBack}
            >
              <Undo2 className="size-[18px]" strokeWidth={1.75} />
              Back to customize
            </Button>
            <Button
              type="button"
              size="pill"
              className="h-10 w-full rounded-full bg-[#00272d] px-[13px] text-[10px] tracking-[0.03em] text-[#f2e9d8] hover:bg-[#00343c] md:w-[178px]"
              onClick={onConfirm}
            >
              Prepare final renders
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
