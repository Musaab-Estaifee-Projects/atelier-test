"use client";

import { useMemo, useState } from "react";
import AtelierMark from "@/components/icons/atelier-mark";
import { AtelierSpinner } from "@/components/ui/atelier-spinner";
import { Button } from "@/components/ui/button";
import type { RoomRenderCard } from "@/types/configurator";
import type { SubmitContactForm } from "@/components/configurator/submit-modal";
import BackArrow from "@/components/icons/configurator/back-arrow";
import CustomHeaderStyle from "@/components/icons/configurator/custom-header-style";
import DiamondRule from "@/components/icons/configurator/diamond-rule";
import CustomChevron from "@/components/icons/custom-chevron";
import FromFrame from "@/components/icons/form-frame";
import TitleRule from "@/components/icons/title-rule";
import { Input } from "@/components/ui/input";

const ROLES = [
  { id: "considering", label: "Considering a purchase" },
  { id: "owner", label: "An owner of this unit" },
  { id: "agent", label: "An agent" },
] as const;

type RoleId = (typeof ROLES)[number]["id"];

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
          <h2 className="font-libre-baskerville text-[clamp(24px,2.4vw,32px)] leading-[1.16] font-normal tracking-[0.05em] text-[#f2e9d8]">
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

const QuoteForm = ({
  pending,
  error,
  onSubmit,
}: {
  pending: boolean;
  error?: string | null;
  onSubmit: (contact: SubmitContactForm) => void;
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<RoleId>("owner");
  const [contactOk, setContactOk] = useState(true);
  const [termsOk, setTermsOk] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setLocalError("Please fill in name, email, and phone.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setLocalError("Enter a valid email address.");
      return;
    }
    if (!contactOk || !termsOk) {
      setLocalError("Please accept the required agreements.");
      return;
    }
    void role;
    setLocalError(null);
    onSubmit({
      name: name.trim(),
      email: email.trim(),
      phone: `+971 ${phone.trim()}`,
    });
  };

  return (
    <aside className="relative w-full shrink-0 lg:sticky lg:top-6 lg:w-86.5">
      <FromFrame className="pointer-events-none absolute inset-0 hidden! h-full w-full lg:block!" />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex flex-col gap-8 border border-white/10 bg-white/5 p-7 lg:border-0 lg:bg-transparent lg:p-9"
      >
        <h2 className="font-libre-baskerville text-[clamp(24px,2.4vw,32px)] leading-[1.16] font-normal tracking-[0.05em] text-[#f2e9d8]">
          Where should we send it?
        </h2>

        <div className="flex w-full flex-col gap-3">
          <label className="w-full border-b border-dashed border-white/35 py-3.5">
            <span className="sr-only">Full Name</span>
            <input
              className="w-full bg-transparent text-[12px] leading-[1.2] text-white outline-none placeholder:text-white/28"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              disabled={pending}
            />
          </label>

          <label className="w-full border-b border-dashed border-white/35 py-3.5">
            <span className="sr-only">Email</span>
            <input
              type="email"
              className="w-full bg-transparent text-[12px] leading-[1.2] text-white outline-none placeholder:text-white/28"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={pending}
            />
          </label>

          <div className="flex w-full items-center gap-2 border-b border-dashed border-white/35 py-3.5">
            <span className="shrink-0 text-[12px] leading-[1.2] text-white/70">
              +971
            </span>

            <CustomChevron className="h-1.5 w-2.5" />

            <input
              className="min-w-0 flex-1 bg-transparent text-[12px] leading-[1.2] text-white outline-none placeholder:text-white/28"
              placeholder="50 XXX XXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              inputMode="tel"
              disabled={pending}
            />
          </div>
        </div>

        <fieldset className="flex flex-col items-start">
          <legend className="text-[10px] leading-[1.2] font-medium tracking-[0.03em] text-white/50 uppercase mb-3">
            I Am
          </legend>

          <div className="flex flex-col items-start gap-1.75">
            {ROLES.map((item) => {
              const selected = role === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRole(item.id)}
                  className={`inline-flex h-8 items-center justify-center rounded-full bg-white/5 px-5 text-[10px] leading-[1.2] font-medium tracking-[0.03em] text-white uppercase ${
                    selected
                      ? "border border-white/70"
                      : "border border-transparent text-white/80"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex w-full flex-col gap-4">
          <label className="flex items-start gap-1.75 text-[12px] leading-[1.2] text-white/70 cursor-pointer">
            <Input
              type="checkbox"
              checked={contactOk}
              onChange={(e) => setContactOk(e.target.checked)}
              className="mt-0.5 size-2.5 shrink-0 bg-white"
            />
            I agree to be contacted about this quotation.
          </label>

          <label className="flex items-start gap-1.75 text-[12px] leading-[1.2] text-white/70 cursor-pointer">
            <Input
              type="checkbox"
              checked={termsOk}
              onChange={(e) => setTermsOk(e.target.checked)}
              className="mt-0.5 size-2.5 shrink-0 bg-white"
            />
            <span>
              I agree on the{" "}
              <span className="underline">Terms &amp; Conditions</span> and{" "}
              <span className="underline">Privacy Policy</span>
            </span>
          </label>
        </div>

        {(localError || error) && (
          <p className="text-sm text-[#e29584]">{localError || error}</p>
        )}

        <Button
          type="submit"
          variant="pill-solid"
          size="pill"
          className="w-full"
          disabled={pending}
        >
          {pending ? "Submitting…" : "Submit"}
        </Button>
      </form>
    </aside>
  );
};

const FinalDesignProgress = ({
  open,
  rooms,
  unitSubtitle,
  error,
  submitPending = false,
  submitError = null,
  onBack,
  onView,
  onRetry,
  onSubmit,
}: Props) => {
  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-[60] overflow-y-auto overflow-x-hidden bg-[#00272d] text-white"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fd-progress-title"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0! left-[16%] h-[min(382px,42vw)] overflow-hidden opacity-45">
        {/* <img
          src="/images/review/header-bg.png"
          alt=""
          className="h-full w-full object-cover object-[center_top]"
        /> */}
        <CustomHeaderStyle className="h-full w-full object-cover object-[center_top]" />
      </div>

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
            className="text-center font-libre-baskerville text-[clamp(26px,3vw,36px)] leading-[1.16] font-normal tracking-[0.05em] text-[#f2e9d8]"
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

        <div className="mt-8 flex flex-col gap-10 lg:mt-10 lg:flex-row lg:items-start lg:gap-8">
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

          <QuoteForm
            pending={submitPending}
            error={submitError}
            onSubmit={onSubmit}
          />
        </div>
      </div>
    </div>
  );
};

export default FinalDesignProgress;
