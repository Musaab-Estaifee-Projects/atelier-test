"use client";

import { useState } from "react";
import CustomChevron from "@/components/icons/custom-chevron";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROLES } from "@/constants/const";
import { ContactInfo, RoleId } from "@/types/types";

type Props = {
  pending: boolean;
  error?: string | null;
  /** Called after local validation — opens the dialog with this payload */
  onRequestConfirm: (info: ContactInfo) => void;
};

const ContactStep = ({ pending, error, onRequestConfirm }: Props) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<RoleId>("owner");
  const [contactOk, setContactOk] = useState(true);
  const [termsOk, setTermsOk] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPhone) {
      setLocalError("Please fill in name, email, and phone.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setLocalError("Enter a valid email address.");
      return;
    }
    if (!contactOk || !termsOk) {
      setLocalError("Please accept the required agreements.");
      return;
    }

    setLocalError(null);
    onRequestConfirm({
      name: trimmedName,
      email: trimmedEmail,
      phone: `+971 ${trimmedPhone}`,
      role,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative z-10 flex w-full max-w-[29.125rem] flex-col gap-8 overflow-y-auto hidden-scrollbar lg:border-0"
      data-lenis-prevent
    >
      <h2 className="text-center font-libre-baskerville text-[1.25rem] font-normal leading-[1.16] tracking-[0.05em] text-[#f2e9d8] capitalize md:text-[1.625rem]">
        Tell us About Yourself
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
        <legend className="mb-3 text-[10px] font-medium leading-[1.2] tracking-[0.03em] text-white/50 uppercase">
          I Am
        </legend>
        <div className="flex flex-wrap items-start gap-1.75">
          {ROLES.map((item) => {
            const selected = role === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setRole(item.id)}
                className={`inline-flex h-8 items-center justify-center rounded-full bg-white/5 px-5 text-[10px] font-medium leading-[1.2] tracking-[0.03em] text-white uppercase ${
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
        <label className="flex cursor-pointer items-start gap-1.75 text-[12px] leading-[1.2] text-white/70">
          <Input
            type="checkbox"
            checked={contactOk}
            onChange={(e) => setContactOk(e.target.checked)}
            className="mt-0.5 size-2.5 shrink-0 bg-white"
          />
          I agree to be contacted about this quotation.
        </label>

        <label className="flex cursor-pointer items-start gap-1.75 text-[12px] leading-[1.2] text-white/70">
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
        <p role="alert" className="text-sm text-[#e29584]">
          {localError || error}
        </p>
      )}

      <Button
        type="submit"
        variant="pill"
        size="pill"
        className="w-full text-[12px] text-white"
        disabled={pending}
      >
        {pending ? "Checking…" : "Continue"}
      </Button>
    </form>
  );
};

export default ContactStep;
