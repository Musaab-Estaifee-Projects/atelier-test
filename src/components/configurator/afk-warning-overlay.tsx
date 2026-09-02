/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import OverlayDialog from "../ui/overlay-dialog";
import { CustomShape } from "../shared/custom-shape";
import { RotateCwFadingClock } from "lucide-react";

type Props = {
  countdown: number;
  total?: number;
  onStay: () => void;
};

function formatCountdown(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  if (safe >= 60) {
    const minutes = Math.floor(safe / 60);
    const rest = safe % 60;
    return `${minutes}:${String(rest).padStart(2, "0")}`;
  }
  return `${safe}`;
}

const SIZE = 100;
const STROKE = 2;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AfkWarningOverlay = ({ countdown, total = 60, onStay }: Props) => {
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

  const progress = Math.max(0, Math.min(1, countdown / total));
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <OverlayDialog
      open={true}
      titleHidden
      onOpenChange={(next) => {
        if (!next) onStay();
      }}
      title="Session ending soon"
      blur={false}
      overlayClassName="z-52"
      contentClassName="z-52 w-[min(100%-2rem,674px)] flex items-center justify-center"
    >
      <div ref={rootRef} className="relative w-auto overflow-hidden">
        <CustomShape
          className="w-auto h-auto max-w-[34.375rem]"
          radius={{
            base: 18,
            sm: 20,
            md: 24,
          }}
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={1}
        >
          <div className="relative z-10 flex flex-col items-center gap-6 px-6 py-8 sm:gap-5 sm:px-11.5 sm:py-8 lg:px-30">
            <div className="flex flex-col items-center justify-center gap-[0.875rem]">
              <RotateCwFadingClock
                className="size-[2.9435rem] text-[#F2E9D8]"
                strokeWidth={1}
              />

              <h2 className="font-baskerville text-[1.625rem] text-[#f2e9d8] capitalize">
                Session ending soon
              </h2>

              <p className="text-sm text-white opacity-70">
                The 3D session will end due to inactivity.
              </p>
            </div>

            {/* Animated progress ring */}
            <div className="relative flex size-[6.25rem] items-center justify-center">
              <svg
                className="absolute inset-0 size-full -rotate-90"
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                aria-hidden
              >
                <circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke="rgba(255,255,255,0.10)"
                  strokeWidth={STROKE}
                />
                <circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={dashOffset}
                  style={{
                    transition: "stroke-dashoffset 1s linear",
                  }}
                />
              </svg>

              <div className="relative z-10 flex flex-col items-center justify-center">
                <span className="font-baskerville text-[1.625rem] tabular-nums text-[#f2e9d8]">
                  {remaining}
                </span>
                <span className="text-[0.625rem] uppercase leading-[120%] tracking-[0.01875rem] text-[#f2e9d8] opacity-50">
                  seconds
                </span>
              </div>
            </div>

            <Button
              ref={stayRef}
              type="button"
              variant="pill-soft"
              size="pill"
              onClick={onStay}
            >
              I am Back
            </Button>
          </div>
        </CustomShape>
      </div>
    </OverlayDialog>
  );
};

export default AfkWarningOverlay;
