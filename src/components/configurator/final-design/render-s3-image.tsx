"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [400, 900, 1600] as const;

type Props = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fit?: "cover" | "contain";
  quality?: number;
  /** Fired when the image is activated (click). */
  onActivate?: () => void;
};

/**
 * S3 / signed render images: remount and retry a few times on flaky network
 * resets (e.g. ERR_CONNECTION_RESET). No loading / broken overlay UI.
 */
export default function RenderS3Image({
  src,
  alt,
  className,
  sizes = "100vw",
  priority = false,
  fit = "cover",
  quality,
  onActivate,
}: Props) {
  const [attempt, setAttempt] = useState(0);
  const retryTimerRef = useRef<number | null>(null);
  const attemptRef = useRef(0);

  const clearRetryTimer = () => {
    if (retryTimerRef.current != null) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  };

  useEffect(() => {
    clearRetryTimer();
    attemptRef.current = 0;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when signed URL changes
    setAttempt(0);
    return clearRetryTimer;
  }, [src]);

  const scheduleRetry = useCallback(() => {
    const current = attemptRef.current;
    if (current + 1 >= MAX_ATTEMPTS) return;
    const delay = BACKOFF_MS[current] ?? BACKOFF_MS[BACKOFF_MS.length - 1];
    clearRetryTimer();
    retryTimerRef.current = window.setTimeout(() => {
      attemptRef.current = current + 1;
      setAttempt(current + 1);
    }, delay);
  }, []);

  return (
    <>
      <Image
        key={`${src}::${attempt}`}
        src={src}
        alt={alt}
        fill
        unoptimized
        priority={priority}
        quality={quality}
        sizes={sizes}
        draggable={false}
        className={cn(
          "pointer-events-none select-none",
          fit === "contain" ? "object-contain" : "object-cover",
          className,
        )}
        onLoad={clearRetryTimer}
        onError={scheduleRetry}
      />

      {onActivate ? (
        <button
          type="button"
          className="absolute inset-0 z-10 cursor-zoom-in bg-transparent"
          aria-label={alt}
          onClick={(event) => {
            event.preventDefault();
            onActivate();
          }}
        />
      ) : null}
    </>
  );
}
