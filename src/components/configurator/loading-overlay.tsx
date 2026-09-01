"use client";

import { useEffect, useState } from "react";
import AtelierMark from "@/components/icons/atelier-mark";
import { AtelierSpinner } from "@/components/ui/atelier-spinner";
import { Button } from "@/components/ui/button";
import type { StreamOverlayKind } from "@/lib/configurator/loading-config";
import TitleRule from "../icons/title-rule";
import { pageNoiseStyle } from "@/lib/ui/page-noise";

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
};

const SessionBackdrop = ({ src }: { src: string }) => {
  return (
    <div className="pointer-events-none absolute inset-0 opacity-70">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="h-full w-full object-cover object-left"
      />
      <div className="absolute inset-0 bg-[linear-gradient(270deg,#00272D_28.5%,rgba(0,39,45,0)_64.92%)]" />
      {/* <div className="absolute inset-0 bg-gradient-to-l from-[#00272d] from-[28%] to-transparent to-[65%]" /> */}
    </div>
  );
};

const LoadingUnit = ({
  progress,
  unitSubtitle,
}: {
  progress: number;
  unitSubtitle: string;
}) => {
  const pct = Math.min(100, Math.max(0, progress));

  return (
    <div className="flex w-full max-w-[520px] flex-col items-center">
      <h1 className="text-center font-libre-baskerville text-[clamp(26px,4vw,36px)] leading-[1.16] font-normal tracking-[0.05em] text-white">
        Loading Your Unit
      </h1>
      <p className="mt-3 text-center text-[14px] leading-[1.2] text-white/70">
        {unitSubtitle}
      </p>
      <div className="mt-6 h-[2px] w-full max-w-[467px] overflow-hidden bg-white/10">
        <div
          className="h-full bg-[#ada599] transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-8 grid w-full max-w-[450px] grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
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
    <div className="flex w-full max-w-[520px] flex-col items-center">
      <p className="text-[12px] leading-[1.2] tracking-[0.07em] text-[#f2e9d8] uppercase">
        Connection interrupted
      </p>
      <h1 className="mt-3 text-center font-libre-baskerville text-[clamp(26px,4vw,36px)] leading-[1.16] font-normal tracking-[0.05em] text-white">
        {title}
      </h1>
      <p className="mt-3 text-center text-[14px] leading-[1.2] text-white/70">
        {subtitle}
      </p>
      <div className="mt-6 h-[2px] w-full max-w-[467px] overflow-hidden bg-white/10">
        <div
          className="h-full bg-[#ada599] transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const HintCard = ({
  icon,
  iconClass,
  label,
}: {
  icon: string;
  iconClass: string;
  label: string;
}) => {
  return (
    <div className="flex flex-col items-center gap-5 border border-white/10 p-[21px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={icon} alt="" className={iconClass} />
      <p className="text-center text-[12px] leading-[1.2] text-white">
        {label}
      </p>
    </div>
  );
};

const QueueWait = ({
  position,
  onBrowseStyles,
}: {
  position: number;
  onBrowseStyles?: () => void;
}) => {
  return (
    <div className="flex w-full max-w-[520px] flex-col items-center px-2">
      <AtelierSpinner className="mb-7" />
      <p className="text-[12px] leading-[1.2] tracking-[0.07em] text-[#f2e9d8] uppercase">
        All 3D sessions are busy
      </p>
      <h1 className="mt-3 text-center font-libre-baskerville text-[clamp(26px,4vw,36px)] leading-[1.16] font-normal tracking-[0.05em] text-white">
        You&apos;re{" "}
        <span className="text-[#ada599]">
          {position > 0 ? position : "next"}
        </span>{" "}
        in line
      </h1>

      <TitleRule className="mt-4 h-px w-31.25" />

      <p className="mt-6 max-w-[420px] text-center text-[14px] leading-[1.2] text-white/70">
        You can wait here, or take a look on the styles we prepared for you.
      </p>
      <Button
        type="button"
        variant="pill"
        size="pill"
        className="mt-6 w-full max-w-[284px] whitespace-normal"
        onClick={onBrowseStyles}
      >
        Browse ready styles
      </Button>
    </div>
  );
};

const SessionEnded = ({
  eyebrow,
  title,
  selectionCount,
  secondaryLabel,
  onReconnect,
  onSecondary,
}: {
  eyebrow: string;
  title: string;
  selectionCount: number;
  secondaryLabel: string;
  onReconnect?: () => void;
  onSecondary?: () => void;
}) => {
  const saved =
    selectionCount > 0
      ? `Your selections are saved — ${selectionCount} items. Nothing was lost.`
      : "Your selections are saved. Nothing was lost.";

  return (
    <div className="flex w-full max-w-[720px] flex-col items-center px-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/session/cloud-slash.svg"
        alt=""
        className="mb-6 h-[51px] w-[60px]"
      />

      <p className="text-[12px] leading-[1.2] tracking-[0.07em] text-[#e29584] uppercase">
        {eyebrow}
      </p>

      <h1 className="mt-3 text-center font-libre-baskerville text-[clamp(26px,4vw,36px)] leading-[1.16] font-normal tracking-[0.05em] text-white">
        {title}
      </h1>

      <TitleRule className="mt-4 h-px w-31.25" />

      <p className="mt-6 text-center text-[14px] leading-[1.2] text-white/70">
        {saved}
      </p>

      <Button
        type="button"
        variant="pill"
        size="pill"
        className="mt-6 w-full max-w-[284px] whitespace-normal"
        onClick={onReconnect}
      >
        Reconnect
      </Button>

      <Button
        type="button"
        variant="pill-outline"
        size="pill"
        className="mt-4 w-full max-w-[284px] whitespace-normal"
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
export function ConfiguratorBootOverlay({
  unitSubtitle = "Your residence",
}: {
  unitSubtitle?: string;
}) {
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
}

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
}: Props) => {
  const ended = kind === "disconnected" || kind === "idle";
  const bg = ended
    ? "/images/session/bg-disconnected.png"
    : "/images/session/bg-loading.png";

  return (
    <div
      className={`${layout === "fixed" ? "fixed" : "absolute"} inset-0 z-[70] overflow-hidden bg-[#00272d] text-white`}
      role={ended ? "alertdialog" : "status"}
      aria-modal={ended || undefined}
      aria-live={ended ? "assertive" : "polite"}
      style={pageNoiseStyle(0.12)}
    >
      <SessionBackdrop src={bg} />

      <div className="relative z-10 flex h-full flex-col items-center px-5">
        <div className="absolute top-4 left-1/2 -translate-x-1/2">
          <AtelierMark />
        </div>

        <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center py-24">
          {kind === "loading" ? (
            <LoadingUnit progress={progress} unitSubtitle={unitSubtitle} />
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
              eyebrow={endedEyebrow ?? "Connection lost"}
              title={endedTitle ?? "The 3D session dropped"}
              selectionCount={selectionCount}
              secondaryLabel="Continue to the summary page"
              onReconnect={onReconnect}
              onSecondary={onContinueToSummary}
            />
          ) : null}

          {kind === "idle" ? (
            <SessionEnded
              eyebrow="Session ended"
              title="The 3D session ended due to inactivity"
              selectionCount={selectionCount}
              secondaryLabel="Continue to the summary page"
              onReconnect={onReconnect}
              onSecondary={onBackHome}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
