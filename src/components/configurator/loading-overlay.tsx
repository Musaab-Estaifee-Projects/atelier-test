"use client";

import { useEffect, useState } from "react";
import AtelierMark from "@/components/icons/atelier-mark";
import { AtelierSpinner } from "@/components/ui/atelier-spinner";
import { Button } from "@/components/ui/button";
import type { StreamOverlayKind } from "@/lib/configurator/loading-config";
import TitleRule from "../icons/title-rule";
import { pageNoiseStyle } from "@/lib/ui/page-noise";
import DoorOpen from "../icons/configurator/door-open";
import CloudSlash from "../icons/configurator/cloud-slash";
import { SessionBackdrop } from "./loading-components/session-backdrop";
import { HintCard } from "./loading-components/hint-card";
import Link from "next/link";

export type { StreamOverlayKind };

type Props = {
  kind: StreamOverlayKind;
  progress: number;
  unitSubtitle: string;
  queuePosition?: number | null;
  selectionCount?: number;
  onReconnect?: () => void;
  onContinueToSummary?: () => void;
  onBackHome?: () => void;
  onBrowseStyles?: () => void;
  reconnectTitle?: string;
  reconnectSubtitle?: string;
  endedEyebrow?: string;
  endedTitle?: string;
  /** Full-viewport lock for the pre-shell boot state. */
  layout?: "absolute" | "fixed";
  bootError?: string | null;
  onRetryBoot?: () => void;
  progressLabel?: string | null;
  endedMessage?: string | null;
};

const LoadingUnit = ({
  progress,
  unitSubtitle,
  bootError,
  onRetryBoot,
  progressLabel,
}: {
  progress: number;
  unitSubtitle: string;
  bootError?: string | null;
  onRetryBoot?: () => void;
  progressLabel?: string | null;
}) => {
  const pct = Math.min(100, Math.max(0, progress));

  return (
    <div className="flex w-full max-w-130 flex-col items-center">
      <h1 className="text-center font-baskerville text-[clamp(26px,4vw,36px)] leading-[1.16] font-normal tracking-wider text-white">
        Loading Your Residence
      </h1>
      {unitSubtitle === "Your residence" ? (
        <p className="mt-3 text-center text-[14px] leading-[1.2] text-white/70 capitalize animate-pulse">
          {unitSubtitle}
        </p>
      ) : (
        <p className="mt-3 text-center text-[14px] leading-[1.2] text-white/70 capitalize">
          {unitSubtitle}
        </p>
      )}
      <div className="mt-6 h-0.5 w-full max-w-116.75 overflow-hidden bg-white/10">
        <div
          className="h-full bg-[#ada599] transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      {progressLabel ? (
        <p className="mt-3 text-center text-[12px] leading-[1.4] tracking-[0.02em] text-white/55">
          {progressLabel}
        </p>
      ) : null}

      <div className="mt-8 grid w-full max-w-112.5 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <HintCard
          icon="/images/session/keys.svg"
          iconClass="h-[57px] w-[86px]"
          label="Use arrow buttons on your keyboard to move"
        />
        <HintCard
          icon="/images/session/mouse.svg"
          iconClass="h-[57px] w-[87px]"
          label="Click and drag using your mouse to look around"
        />
      </div>

      {bootError ? (
        <div className="mt-6 flex flex-col items-center gap-3">
          <p className="text-center text-sm text-white/70">{bootError}</p>
          {onRetryBoot ? (
            <Button
              type="button"
              variant="pill-soft"
              size="pill"
              onClick={onRetryBoot}
            >
              Retry
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

const ReconnectingUnit = ({
  progress,
  title,
  subtitle,
}: {
  progress: number;
  title: string;
  subtitle: string;
}) => {
  const pct = Math.min(100, Math.max(0, progress));

  return (
    <div className="flex w-full max-w-130 flex-col items-center">
      <p className="text-[12px] leading-[1.2] tracking-[0.07em] text-[#f2e9d8] uppercase">
        Connection interrupted
      </p>
      <h1 className="mt-3 text-center font-baskerville text-[clamp(26px,4vw,36px)] leading-[1.16] font-normal tracking-wider text-white">
        {title}
      </h1>
      <p className="mt-3 text-center text-[14px] leading-[1.2] text-white/70 capitalize">
        {subtitle}
      </p>
      <div className="mt-6 h-0.5 w-full max-w-116.75 overflow-hidden bg-white/10">
        <div
          className="h-full bg-[#ada599] transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const QueueWait = ({
  position,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onBrowseStyles,
}: {
  position: number;
  onBrowseStyles?: () => void;
}) => {
  return (
    <div className="flex w-full max-w-130 flex-col items-center px-2">
      <AtelierSpinner className="mb-7" />
      <p className="text-[12px] leading-[1.2] tracking-[0.07em] text-[#f2e9d8] uppercase">
        All sessions are busy
      </p>
      <h1 className="mt-3 text-center font-baskerville text-[clamp(26px,4vw,36px)] leading-[1.16] font-normal tracking-wider text-white">
        You are No.{" "}
        <span className="text-[#ada599]">
          {position > 0 ? position : "next"}
        </span>{" "}
        in line
      </h1>

      <TitleRule className="mt-4 h-px w-31.25" />

      <p className="mt-6 max-w-105 text-center text-[14px] leading-[1.2] text-white/70">
        While you wait, explore the exclusive styles in Atelier Collections.
      </p>

      {/* <Button
        type="button"
        variant="pill"
        size="pill"
        className="mt-6 w-full max-w-71 whitespace-normal"
        onClick={onBrowseStyles}
      >
        Browse Atelier Collections
      </Button> */}

      <Button
        asChild
        variant="pill"
        size="pill"
        className="mt-6 w-full max-w-71 whitespace-normal"
      >
        <Link target="_blank" href="/styles/browse-styles">
          Browse Atelier Collections
        </Link>
      </Button>
    </div>
  );
};

const SessionEnded = ({
  eyebrow,
  icon,
  title,
  selectionCount,
  secondaryLabel,
  message,
  onReconnect,
  onSecondary,
}: {
  eyebrow?: string;
  icon: React.ReactNode;
  title: string;
  selectionCount: number;
  secondaryLabel: string;
  message?: string;
  onReconnect?: () => void;
  onSecondary?: () => void;
}) => {
  const saved =
    message ??
    (selectionCount > 0
      ? `Your selections are saved: ${selectionCount} items. Nothing was lost.`
      : "In case you have selections. Nothing will be lost. All of your selections will be saved.");

  return (
    <div className="flex w-full max-w-180 flex-col items-center px-2">
      {icon}

      {eyebrow && (
        <p className="text-[12px] leading-[1.2] tracking-[0.07em] text-[#e29584] uppercase">
          {eyebrow}
        </p>
      )}

      <h1
        className={`${eyebrow ? "mt-3" : "mt-0"} text-center font-baskerville text-[2rem] md:text-[2.25rem] leading-[1.16] font-normal tracking-wider text-white capitalize`}
      >
        {title}
      </h1>

      <TitleRule className={`${eyebrow ? "mt-4" : "mt-1"} h-px w-31.25`} />

      <p className="mt-6 text-center text-[14px] leading-[1.2] text-white/70">
        {saved}
      </p>

      {onReconnect ? (
        <Button
          type="button"
          variant="pill"
          size="pill"
          className="mt-6 w-full max-w-71 whitespace-normal"
          onClick={onReconnect}
        >
          Reconnect
        </Button>
      ) : null}

      <Button
        type="button"
        variant="pill-outline"
        size="pill"
        className="mt-4 w-full max-w-71 whitespace-normal"
        onClick={onSecondary}
      >
        {secondaryLabel}
      </Button>
    </div>
  );
};

export function streamOverlayKind(args: {
  streamPhase?: StreamOverlayKind;
  queuePosition: number | null;
  loadingTitle: string;
}): StreamOverlayKind {
  if (args.streamPhase === "idle") return "idle";
  if (args.streamPhase === "error") return "error";
  if (args.streamPhase === "disconnected") return "disconnected";
  if (args.streamPhase === "reconnecting") return "reconnecting";
  if (args.streamPhase === "queue") return "queue";
  if (args.queuePosition != null && args.queuePosition > 0) return "queue";
  if (/inactiv|session ended/i.test(args.loadingTitle)) return "idle";
  if (/reconnect failed/i.test(args.loadingTitle)) return "disconnected";
  if (/reconnect/i.test(args.loadingTitle)) return "reconnecting";
  if (/disconnected|failed/i.test(args.loadingTitle)) {
    return "disconnected";
  }
  return "loading";
}

/** Full-screen boot state used before the stream shell hydrates. */
const ConfiguratorBootOverlay = ({
  unitSubtitle = "Your residence",
}: {
  unitSubtitle?: string;
}) => {
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    const id = window.setInterval(() => {
      setProgress((p) => (p >= 22 ? p : p + 0.35));
    }, 180);
    return () => window.clearInterval(id);
  }, []);

  return (
    <LoadingOverlay
      layout="fixed"
      kind="loading"
      progress={progress}
      unitSubtitle={unitSubtitle}
    />
  );
};

const LoadingOverlay = ({
  kind,
  progress,
  unitSubtitle,
  queuePosition,
  selectionCount = 0,
  onReconnect,
  onContinueToSummary,
  onBackHome,
  onBrowseStyles,
  reconnectTitle,
  reconnectSubtitle,
  endedEyebrow,
  endedTitle,
  layout = "absolute",
  bootError,
  onRetryBoot,
  progressLabel,
  endedMessage,
}: Props) => {
  const ended = kind === "disconnected" || kind === "idle" || kind === "error";
  const bg = ended
    ? "/images/session/bg-disconnected.png"
    : "/images/session/bg-loading.png";

  return (
    <div
      className={`${layout === "fixed" ? "fixed" : "absolute"} inset-0 z-70 overflow-hidden bg-[#00272d] text-white`}
      role={ended ? "alertdialog" : "status"}
      aria-modal={ended || undefined}
      aria-live={ended ? "assertive" : "polite"}
      style={pageNoiseStyle(0.11)}
    >
      <SessionBackdrop src={bg} />

      <div className="relative z-10 flex h-full flex-col items-center px-5">
        <div className="absolute top-4 left-1/2 -translate-x-1/2">
          <AtelierMark />
        </div>

        <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center py-24">
          {kind === "loading" ? (
            <LoadingUnit
              progress={progress}
              unitSubtitle={unitSubtitle}
              bootError={bootError}
              onRetryBoot={onRetryBoot}
              progressLabel={progressLabel}
            />
          ) : null}

          {kind === "reconnecting" ? (
            <ReconnectingUnit
              progress={progress}
              title={reconnectTitle ?? "Reconnecting"}
              subtitle={
                reconnectSubtitle ??
                "Please wait while we restore your session..."
              }
            />
          ) : null}

          {kind === "queue" ? (
            <QueueWait
              position={queuePosition ?? 0}
              onBrowseStyles={onBrowseStyles}
            />
          ) : null}

          {kind === "disconnected" ? (
            <SessionEnded
              // eyebrow={endedEyebrow ?? "Connection lost"}
              icon={<CloudSlash className="mb-4 h-12.75 w-15" />}
              title={endedTitle ?? "Connection lost"}
              selectionCount={selectionCount}
              secondaryLabel="Continue to the summary page"
              onReconnect={onReconnect}
              onSecondary={onContinueToSummary}
            />
          ) : null}

          {kind === "error" ? (
            <SessionEnded
              // eyebrow={endedEyebrow ?? "Unable to load"}
              icon={<CloudSlash className="mb-4 h-12.75 w-15" />}
              title={endedTitle ?? "The session could not open"}
              selectionCount={0}
              message={
                endedMessage ??
                "Please try again, or go back and choose another residence."
              }
              secondaryLabel="Start new customization"
              onReconnect={onReconnect}
              onSecondary={onBackHome}
            />
          ) : null}

          {kind === "idle" ? (
            <SessionEnded
              eyebrow="Session ended"
              icon={<DoorOpen className="mb-6 size-16!" />}
              title="The session ended due to inactivity"
              selectionCount={selectionCount}
              secondaryLabel="Continue to the summary page"
              onReconnect={onReconnect}
              onSecondary={onContinueToSummary}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export { ConfiguratorBootOverlay };

export default LoadingOverlay;
