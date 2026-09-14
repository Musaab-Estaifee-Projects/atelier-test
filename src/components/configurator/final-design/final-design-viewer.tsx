"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export type LightboxStill = {
  cameraName: string;
  cameraLabel: string;
  zoneId: string;
  zoneName: string;
  label: string;
  imageUrl: string;
};

type Props = {
  stills: LightboxStill[];
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

export default function FinalDesignViewer({
  stills,
  index,
  onIndexChange,
  onClose,
}: Props) {
  const [touchX, setTouchX] = useState<number | null>(null);
  const [cachedIndex, setCachedIndex] = useState(0);
  const [hasOpened, setHasOpened] = useState(false);

  useEffect(() => {
    if (index == null) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCachedIndex(index);
    setHasOpened(true);
  }, [index]);

  const shownIndex = index ?? cachedIndex;
  const current = stills[shownIndex];
  const open = index != null && Boolean(current);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight" && stills.length) {
        onIndexChange((index! + 1) % stills.length);
      }
      if (event.key === "ArrowLeft" && stills.length) {
        onIndexChange((index! - 1 + stills.length) % stills.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, stills.length, onClose, onIndexChange]);

  if (!current) return null;
  if (index == null && !hasOpened) return null;
  const hasMany = stills.length > 1;

  const goPrev = () =>
    onIndexChange((shownIndex - 1 + stills.length) % stills.length);
  const goNext = () => onIndexChange((shownIndex + 1) % stills.length);

  return (
    <div
      className={
        open ? "fixed inset-0 z-[80] flex flex-col bg-black" : "hidden"
      }
      role="dialog"
      aria-modal={open}
      aria-hidden={!open}
      aria-label={current.label}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-zoom-out"
        aria-label="Close"
        onClick={onClose}
      />
      <button
        type="button"
        className="absolute top-4 right-4 z-20 flex size-10 items-center justify-center text-white/80 hover:text-white"
        onClick={onClose}
        aria-label="Close"
      >
        <X className="size-6" strokeWidth={1.5} />
      </button>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-2 pb-4 pt-12 sm:px-4">
        <div
          className="relative h-[min(82dvh,calc(100dvh-8.5rem))] w-[min(98vw,1920px)]"
          onTouchStart={(e) => setTouchX(e.touches[0]?.clientX ?? null)}
          onTouchEnd={(e) => {
            if (touchX == null) return;
            const dx = (e.changedTouches[0]?.clientX ?? touchX) - touchX;
            if (Math.abs(dx) > 40 && hasMany) {
              if (dx < 0) goNext();
              else goPrev();
            }
            setTouchX(null);
          }}
        >
          <Image
            src={current.imageUrl}
            alt={current.label}
            fill
            unoptimized
            quality={100}
            className="object-contain"
            sizes="100vw"
          />

          {hasMany ? (
            <>
              <button
                type="button"
                onClick={goPrev}
                aria-label="Previous render"
                className="absolute top-1/2 left-2 z-10 flex size-10 -translate-y-1/2 items-center justify-center text-white/80 hover:text-white sm:left-4 sm:size-12"
              >
                <ChevronLeft className="size-8 sm:size-10" strokeWidth={1.25} />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Next render"
                className="absolute top-1/2 right-2 z-10 flex size-10 -translate-y-1/2 items-center justify-center text-white/80 hover:text-white sm:right-4 sm:size-12"
              >
                <ChevronRight
                  className="size-8 sm:size-10"
                  strokeWidth={1.25}
                />
              </button>
            </>
          ) : null}
        </div>

        <p className="mt-4 max-w-full px-4 text-center text-[12px] font-medium tracking-[0.12em] text-white uppercase sm:text-[13px]">
          {current.zoneName} - {current.cameraLabel}
        </p>
        <p className="mt-1 text-center text-[12px] text-white/55">
          {shownIndex + 1}/{stills.length}
        </p>
      </div>
    </div>
  );
}
