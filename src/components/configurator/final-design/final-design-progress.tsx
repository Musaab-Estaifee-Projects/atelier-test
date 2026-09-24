"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import AtelierMark from "@/components/icons/atelier-mark";
import ConfirmTermsDialog from "@/components/configurator/confirm-terms-dialog";
import { AtelierSpinner } from "@/components/ui/atelier-spinner";
import { Button } from "@/components/ui/button";
import type { RoomRenderCard } from "@/types/configurator";
import DiamondRule from "@/components/icons/configurator/diamond-rule";
import TitleRule from "@/components/icons/title-rule";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  rooms: RoomRenderCard[];
  unitSubtitle: string;
  error?: string | null;
  total?: number;
  confirmDisabled?: boolean;
  confirmPending?: boolean;
  confirmError?: string | null;
  title?: string;
  /** Keep-offline: layout-matched room grid instead of a centered spinner. */
  skeleton?: boolean;
  onConfirm?: () => void;
  onView: (zoneId: string, cameraName?: string) => void;
  onRetry: (zoneId: string) => void;
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

function stillProgress(room: RoomRenderCard) {
  const total = Math.max(room.stills.length, 1);
  const done = room.stills.filter((s) => s.imageUrl).length;
  return { done, total };
}

const RenderingTile = () => (
  <div className="relative aspect-711/398 w-full overflow-hidden bg-[#003d43]">
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
      <AtelierSpinner />
      <p className="text-[12px] leading-[1.2] tracking-[0.07em] text-[#f2e9d8] uppercase">
        Rendering
      </p>
    </div>
  </div>
);

const RendersRoomsSkeleton = () => (
  <div aria-hidden>
    {Array.from({ length: 3 }).map((_, roomIndex) => (
      <section key={roomIndex} className="mb-12 last:mb-0">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="h-[clamp(24px,2.4vw,32px)] w-48 animate-pulse bg-white/10" />
            <DiamondRule className="mt-1.5 h-4.5 w-37.5" />
          </div>
          <div className="h-3.5 w-28 animate-pulse bg-white/10" />
        </div>
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((__, tileIndex) => (
            <RenderingTile key={tileIndex} />
          ))}
        </div>
      </section>
    ))}
  </div>
);

const RoomBlock = ({
  room,
  onView,
  onRetry,
}: {
  room: RoomRenderCard;
  onView: (zoneId: string, cameraName?: string) => void;
  onRetry: (zoneId: string) => void;
}) => {
  const { done, total } = stillProgress(room);
  const tiles = useMemo(() => {
    const list = [...room.stills];
    if (list.length === 0) {
      return Array.from({ length: 4 }, (_, i) => ({
        cameraName: `placeholder-${i}`,
        imageUrl: undefined as string | undefined,
      }));
    }
    return list;
  }, [room.stills]);

  return (
    <section className="mb-12 last:mb-0">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-baskerville text-[clamp(24px,2.4vw,32px)] leading-[1.16] font-normal tracking-wider text-[#f2e9d8]">
            {room.label}
          </h2>

          <DiamondRule className="mt-1.5 h-4.5 w-37.5" />
        </div>
        <p className="text-[14px] leading-[1.2] text-white/70">
          {done} / {total} Completed
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {tiles.map((still, index) => {
          const ready = Boolean(still.imageUrl);
          const failed = room.status === "error" && !ready;
          return (
            <button
              key={`${still.cameraName}-${index}`}
              type="button"
              disabled={!ready && !failed}
              onClick={() => {
                if (failed) onRetry(room.zoneId);
                else if (ready) onView(room.zoneId, still.cameraName);
              }}
              className="relative aspect-711/398 w-full overflow-hidden bg-[#003d43] text-left disabled:cursor-default"
            >
              {ready && still.imageUrl ? (
                <Image
                  src={still.imageUrl}
                  alt={`${room.label} view ${index + 1}`}
                  fill
                  unoptimized
                  className="object-cover pointer-events-none"
                  sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 560px"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <AtelierSpinner />
                  <p className="text-[12px] leading-[1.2] tracking-[0.07em] text-[#f2e9d8] uppercase">
                    {failed ? "Retry" : "Rendering"}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};

const FinalDesignProgress = ({
  open,
  rooms,
  unitSubtitle,
  error,
  total = 0,
  confirmPending = false,
  confirmDisabled = false,
  confirmError = null,
  title = "Creating Final Renders",
  skeleton = false,
  onConfirm,
  onView,
  onRetry,
}: Props) => {
  const [termsOpen, setTermsOpen] = useState(false);

  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-60 h-full overflow-y-auto overscroll-contain hidden-scrollbar overflow-x-hidden bg-[#00272d] text-white pt-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fd-progress-title"
    >
      <div className="relative z-10 mx-auto flex w-full max-w-360 flex-col px-4 pt-5 pb-[calc(11rem+env(safe-area-inset-bottom))] sm:px-9 md:pb-[calc(7.5rem+env(safe-area-inset-bottom))]">
        <header className="relative flex items-center justify-between gap-3">
          <div className="absolute left-1/2 hidden -translate-x-1/2 sm:block">
            <AtelierMark />
          </div>
          <span className="w-9.5 shrink-0 sm:w-42" aria-hidden />
        </header>

        <div className="mt-5 sm:hidden">
          <AtelierMark />
        </div>

        <div className="mt-10 flex flex-col items-center sm:mt-12">
          <h1
            id="fd-progress-title"
            className="text-center font-baskerville text-[clamp(26px,3vw,36px)] leading-[1.16] font-normal tracking-wider text-[#f2e9d8]"
          >
            {title}
          </h1>
          <p className="mt-4 text-center text-[14px] leading-[1.2] text-white/70 capitalize">
            {unitSubtitle}
          </p>

          <TitleRule className="mt-5 h-px w-32.25" />
        </div>

        {error ? (
          <p className="mx-auto mt-6 max-w-xl text-center text-sm text-[#e29584]">
            {error}
          </p>
        ) : null}

        <div className="mt-8 flex flex-col gap-10 lg:mt-10 lg:flex-row lg:items-start lg:gap-8 w-full">
          <div className="min-w-0 flex-1">
            {rooms.length === 0 ? (
              skeleton ? (
                <RendersRoomsSkeleton />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                  <AtelierSpinner />
                  <p className="text-[12px] leading-[1.2] tracking-[0.07em] text-[#f2e9d8] uppercase">
                    Loading renders
                  </p>
                </div>
              )
            ) : (
              rooms.map((room) => (
                <RoomBlock
                  key={room.zoneId}
                  room={room}
                  onView={onView}
                  onRetry={onRetry}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <footer className="fixed pointer-events-none inset-x-0 bottom-0 z-20 flex justify-center px-3 pb-[max(16px,env(safe-area-inset-bottom))] sm:px-4 md:pb-10">
        <div className="pointer-events-auto flex w-full max-w-187.25 flex-col gap-3 rounded-[28px] border-[0.5px] border-white/25 bg-linear-to-l from-[rgba(173,165,153,0.2)] to-[rgba(77,69,57,0.2)] py-3 pr-3 pl-5 backdrop-blur-[25px] md:min-h-13 md:flex-row md:items-center md:justify-between md:gap-3 md:rounded-full md:py-1.5 md:pr-1.5 md:pl-6.25">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="font-baskerville text-[14px] leading-[1.16] tracking-wider text-white">
              Total :
            </p>
            <p className="flex items-center gap-0.5 font-baskerville text-[24px] leading-[1.16] tracking-wider text-white sm:text-[28px]">
              <Dirham size="lg" />
              {Number.isFinite(total) ? total.toLocaleString() : "0"}
            </p>
          </div>
          <div className="flex w-full flex-col items-stretch gap-2 md:w-auto md:items-end">
            {confirmError ? (
              <p className="max-w-56 text-center text-[11px] leading-4 text-[#f2b8b5] md:text-right">
                {confirmError}
              </p>
            ) : null}
            <Button
              type="button"
              size="pill"
              className="h-10 w-full rounded-full bg-[#00272d] px-3.25 text-[10px] tracking-[0.03em] text-[#f2e9d8] hover:bg-[#00343c] disabled:opacity-60 md:w-56"
              disabled={confirmPending || confirmDisabled}
              aria-busy={confirmPending}
              onClick={() => setTermsOpen(true)}
            >
              {confirmPending ? "Confirming…" : "Confirm My Selection"}
            </Button>
          </div>
        </div>
      </footer>

      <ConfirmTermsDialog
        open={termsOpen}
        onCancel={() => setTermsOpen(false)}
        onAgree={() => {
          setTermsOpen(false);
          void onConfirm?.();
        }}
      />
    </div>
  );
};

export default FinalDesignProgress;
