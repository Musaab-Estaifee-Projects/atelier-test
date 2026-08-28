/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import AtelierMark from "@/components/icons/atelier-mark";
import { Button } from "@/components/ui/button";
import TitleRule from "../icons/title-rule";

type Props = {
  countdown: number;
  onStay: () => void;
};

function formatCountdown(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  if (safe >= 60) {
    const minutes = Math.floor(safe / 60);
    const rest = safe % 60;
    return `${minutes}:${String(rest).padStart(2, "0")}`;
  }
  return `${safe}s`;
}

/**
 * Custom AFK warning — StreamPixel's default `#afkOverlay` is hidden.
 * Portaled above configurator chrome and Radix dialogs.
 * @see https://docs.streampixel.io/resources/web-sdk/features/afk-idle-timeout
 */
export default function AfkWarningOverlay({ countdown, onStay }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stayRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    stayRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onStay();
      }
    };

    const onFocusIn = (event: FocusEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        stayRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocusIn);
      previouslyFocused?.focus?.();
    };
  }, [mounted, onStay]);

  if (!mounted) return null;

  const remaining = formatCountdown(countdown);

  return createPortal(
    <div
      ref={rootRef}
      className="fixed inset-0 z-[90] overflow-hidden bg-[#00272d]/80 text-white backdrop-blur-[6px]"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="afk-title"
      aria-describedby="afk-desc"
    >
      <div className="relative z-10 flex h-full flex-col items-center px-5">
        <div className="absolute top-8 left-1/2 -translate-x-1/2 sm:top-11">
          <AtelierMark />
        </div>

        <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center py-24">
          <div className="flex w-full max-w-[560px] flex-col items-center px-2">
            <p className="text-[12px] leading-[1.2] font-normal tracking-[0.07em] text-[#f2e9d8] uppercase">
              Still there?
            </p>
            <h1
              id="afk-title"
              className="mt-3 text-center font-libre-baskerville text-[clamp(26px,4vw,36px)] leading-[1.16] font-normal tracking-[0.05em] text-white"
            >
              You&apos;ve been inactive
            </h1>

            <TitleRule className="mt-4 h-px w-31.25" />

            <p
              id="afk-desc"
              className="mt-6 text-center text-[14px] leading-[1.2] text-white/70"
            >
              This 3D session will end in{" "}
              <span className="text-[#f2e9d8] tabular-nums">{remaining}</span>{" "}
              if nothing happens. Your selections are already saved.
            </p>
            <Button
              ref={stayRef}
              type="button"
              variant="pill"
              size="pill"
              className="mt-6 w-full max-w-[284px] whitespace-normal"
              onClick={onStay}
            >
              I&apos;m still here
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
