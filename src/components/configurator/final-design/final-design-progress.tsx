"use client";

import { useMemo } from "react";
import AtelierMark from "@/components/icons/atelier-mark";
import { AtelierSpinner } from "@/components/ui/atelier-spinner";
import { Button } from "@/components/ui/button";
import type { RoomRenderCard } from "@/types/configurator";
import type { SubmitContactForm } from "@/components/configurator/submit-modal";
import BackArrow from "@/components/icons/configurator/back-arrow";
import DiamondRule from "@/components/icons/configurator/diamond-rule";
import TitleRule from "@/components/icons/title-rule";
// import CustomHeaderStyle from "@/components/icons/configurator/custom-header-style";
// import CustomChevron from "@/components/icons/custom-chevron";
// import FromFrame from "@/components/icons/form-frame";
// import { Input } from "@/components/ui/input";
// import ContactForm from "@/components/shared/contact-form";
// import { ContactInfo } from "@/types/types";/

// const ROLES = [
//   { id: "considering", label: "Considering a purchase" },
//   { id: "owner", label: "An owner of this unit" },
//   { id: "agent", label: "An agent" },
// ] as const;

// type RoleId = (typeof ROLES)[number]["id"];

type Props = {
  open: boolean;
  rooms: RoomRenderCard[];
  unitSubtitle: string;
  error?: string | null;
  submitPending?: boolean;
  submitError?: string | null;
  onBack: () => void;
  onView: (zoneId: string) => void;
  onRetry: (zoneId: string) => void;
  onSubmit: (contact: SubmitContactForm) => void;
};

function stillProgress(room: RoomRenderCard) {
  const total = Math.max(room.stills.length, 1);
  const done = room.stills.filter((s) => s.imageUrl).length;
  return { done, total };
}

const RoomBlock = ({
  room,
  onView,
  onRetry,
}: {
  room: RoomRenderCard;
  onView: (zoneId: string) => void;
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
          <h2 className="font-baskerville text-[clamp(24px,2.4vw,32px)] leading-[1.16] font-normal tracking-[0.05em] text-[#f2e9d8]">
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
                else if (ready) onView(room.zoneId);
              }}
              className="relative aspect-[711/398] w-full overflow-hidden bg-[#003d43] text-left disabled:cursor-default"
            >
              {ready ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={still.imageUrl}
                  alt={`${room.label} view ${index + 1}`}
                  className="absolute inset-0 h-full w-full object-cover"
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

// const QuoteForm = ({
//   pending,
//   error,
//   onSubmit,
// }: {
//   pending: boolean;
//   error?: string | null;
//   onSubmit: (contact: SubmitContactForm) => void;
// }) => {
//   return (
//     <aside className="relative w-full shrink-0 lg:sticky lg:top-6 lg:w-86.5">
//       <FromFrame className="pointer-events-none absolute inset-0 hidden! h-full w-full lg:block!" />

//       <ContactForm
//         pending={pending}
//         error={error}
//         title="Where should we send it?"
//         submitLabel="Submit"
//         pendingLabel="Submitting…"
//         className="border border-white/10 bg-white/5 p-7 lg:border-0 lg:bg-transparent lg:p-9 max-w-none"
//         onSubmit={(info: ContactInfo) => {
//           onSubmit({
//             name: info.name,
//             email: info.email,
//             phone: info.phone,
//           });
//         }}
//       />
//     </aside>
//   );
// };

const FinalDesignProgress = ({
  open,
  rooms,
  unitSubtitle,
  error,
  // submitPending = false,
  // submitError = null,
  onBack,
  onView,
  onRetry,
  // onSubmit,
}: Props) => {
  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-[60] overflow-y-auto overflow-x-hidden bg-[#00272d] text-white"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fd-progress-title"
    >
      {/* <div className="pointer-events-none absolute inset-x-0 top-0! left-[16%] h-[min(382px,42vw)] overflow-hidden opacity-45">
        <CustomHeaderStyle className="h-full w-full object-cover object-[center_top]" />
      </div> */}

      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-col px-4 pt-5 pb-16 sm:px-9">
        <header className="relative flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="pill-solid"
            size="pill-sm"
            onClick={onBack}
          >
            <BackArrow className="w-[0.28125rem]! h-auto" />
            Back To summary
          </Button>
          <div className="absolute left-1/2 hidden -translate-x-1/2 sm:block">
            <AtelierMark />
          </div>
          <span className="w-[38px] shrink-0 sm:w-[168px]" aria-hidden />
        </header>

        <div className="mt-5 sm:hidden">
          <AtelierMark />
        </div>

        <div className="mt-10 flex flex-col items-center sm:mt-12">
          <h1
            id="fd-progress-title"
            className="text-center font-baskerville text-[clamp(26px,3vw,36px)] leading-[1.16] font-normal tracking-[0.05em] text-[#f2e9d8]"
          >
            Creating Final Renders
          </h1>
          <p className="mt-4 text-center text-[14px] leading-[1.2] text-white/70">
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
            {rooms.map((room) => (
              <RoomBlock
                key={room.zoneId}
                room={room}
                onView={onView}
                onRetry={onRetry}
              />
            ))}
          </div>
          {/* 
          <QuoteForm
            pending={submitPending}
            error={submitError}
            onSubmit={onSubmit}
          /> */}
        </div>
      </div>
    </div>
  );
};

export default FinalDesignProgress;
