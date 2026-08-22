// src/components/configurator/submit-modal.tsx
"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

export type SubmitContactForm = {
  name: string;
  email: string;
  phone: string;
};

type Props = {
  open: boolean;
  pending?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (contact: SubmitContactForm) => void;
};

export default function SubmitModal({
  open,
  pending = false,
  error = null,
  onClose,
  onSubmit,
}: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  if (!open || typeof document === "undefined") return null;

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
    setLocalError(null);
    onSubmit({ name: name.trim(), email: email.trim(), phone: phone.trim() });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-title"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl border border-white/10 bg-[#1a1a1c] p-5 text-[#f5f0e8]"
      >
        <h2 id="submit-title" className="mb-1 text-base font-medium">
          Submit your design
        </h2>
        <p className="mb-4 text-xs opacity-60">
          Creates a Design Code you can share. Nothing is saved to the server
          until you submit.
        </p>
        <label className="mb-3 block text-xs opacity-70">
          Name
          <input
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            disabled={pending}
          />
        </label>
        <label className="mb-3 block text-xs opacity-70">
          Email
          <input
            type="email"
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={pending}
          />
        </label>
        <label className="mb-3 block text-xs opacity-70">
          Phone
          <input
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            disabled={pending}
          />
        </label>
        {(localError || error) && (
          <p className="mb-3 text-sm text-[#ff8a8a]">{localError || error}</p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg bg-white/10 px-3 py-2 text-sm"
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-[#4e9cff] px-3 py-2 text-sm text-white disabled:opacity-50"
            disabled={pending}
          >
            {pending ? "Submitting…" : "Submit"}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
