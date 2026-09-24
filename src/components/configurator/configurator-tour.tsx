"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import type {
  ConfiguratorTourStep,
  ConfiguratorTourStepId,
} from "@/hooks/configurator/use-configurator-tour";

type Props = {
  step: ConfiguratorTourStep;
  stepIndex: number;
  stepCount: number;
  onNext: () => void;
  onSkip: () => void;
};

type ArrowSide = "up" | "left" | "down";

type ShellPos = {
  top: number;
  left: number | string;
  x: number | string;
  y: number | string;
  arrow: ArrowSide;
};

const GAP = 12;
const EDGE = 12;
const MD_MIN = 768;

const shellTransition = {
  type: "spring" as const,
  stiffness: 280,
  damping: 30,
  mass: 0.85,
};

const contentTransition = {
  duration: 0.26,
  ease: [0.22, 1, 0.36, 1] as const,
};

const TARGET: Record<ConfiguratorTourStepId, string> = {
  zones: "zones",
  materials: "materials",
  dock: "dock",
};

const ARROW_CLASS: Record<ArrowSide, string> = {
  up: "-top-1.5 left-1/2 -translate-x-1/2 border-x-8 border-b-8 border-x-transparent border-b-[#1A5E63]",
  left: "top-8 -left-1.5 border-y-8 border-r-8 border-y-transparent border-r-[#1A5E63] md:top-10",
  down: "-bottom-1.5 left-1/2 -translate-x-1/2 border-x-8 border-t-8 border-x-transparent border-t-[#1A5E63]",
};

function isMobileViewport() {
  return window.matchMedia(`(max-width: ${MD_MIN - 1}px)`).matches;
}

function measureShell(
  root: HTMLElement,
  stepId: ConfiguratorTourStepId,
  cardWidth: number,
): ShellPos | null {
  const scope = root.parentElement ?? document;
  const target = scope.querySelector<HTMLElement>(
    `[data-tour-target="${TARGET[stepId]}"]`,
  );
  if (!target) return null;

  const rootRect = root.getBoundingClientRect();
  const r = target.getBoundingClientRect();
  const mobile = isMobileViewport();

  if (stepId === "zones") {
    return {
      top: Math.round(r.bottom - rootRect.top + GAP),
      left: "50%",
      x: "-50%",
      y: 0,
      arrow: "up",
    };
  }

  if (stepId === "materials") {
    if (mobile) {
      // Panel is a bottom sheet — sit the tip above it, centered.
      return {
        top: Math.round(r.top - rootRect.top - GAP),
        left: "50%",
        x: "-50%",
        y: "-100%",
        arrow: "down",
      };
    }
    const left = Math.round(r.right - rootRect.left + GAP);
    const maxLeft = Math.max(EDGE, rootRect.width - cardWidth - EDGE);
    return {
      top: Math.round(r.top - rootRect.top + 24),
      left: Math.min(left, maxLeft),
      x: 0,
      y: 0,
      arrow: "left",
    };
  }

  // dock — tip sits just above the dock bar
  return {
    top: Math.round(r.top - rootRect.top - GAP),
    left: "50%",
    x: "-50%",
    y: "-100%",
    arrow: "down",
  };
}

/**
 * Animated tour card. Shell springs between fixed px anchors measured from
 * chrome (`data-tour-target`); centered steps still use left: 50%.
 */
const ConfiguratorTour = ({
  step,
  stepIndex,
  stepCount,
  onNext,
  onSkip,
}: Props) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<ShellPos>({
    top: 120,
    left: "50%",
    x: "-50%",
    y: 0,
    arrow: "up",
  });

  const isLast = stepIndex >= stepCount - 1;

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const update = () => {
      const width = cardRef.current?.offsetWidth ?? 352;
      const next = measureShell(root, step.id, width);
      if (next) setPos(next);
    };

    update();
    // Panel mounts on the materials step — remeasure after paint.
    const raf = window.requestAnimationFrame(update);
    const ro = new ResizeObserver(update);
    ro.observe(root);
    const scope = root.parentElement ?? document;
    const target = scope.querySelector(
      `[data-tour-target="${TARGET[step.id]}"]`,
    );
    if (target) ro.observe(target);

    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [step.id]);

  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cfg-tour-title"
      aria-describedby="cfg-tour-body"
    >
      <motion.div
        className="absolute inset-0 bg-black/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
      />

      <motion.div
        ref={cardRef}
        className="pointer-events-auto absolute w-[min(calc(100%-1.5rem),22rem)] px-3"
        initial={{
          opacity: 0,
          scale: 0.96,
          top: pos.top,
          left: pos.left,
          x: pos.x,
          y: pos.y,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          top: pos.top,
          left: pos.left,
          x: pos.x,
          y: pos.y,
        }}
        transition={shellTransition}
      >
        <div className="relative bg-[#1A5E63] p-4.5 text-white shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={`arrow-${pos.arrow}`}
              aria-hidden
              className={cn("absolute size-0", ARROW_CLASS[pos.arrow])}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            />
          </AnimatePresence>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={contentTransition}
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/55">
                {stepIndex + 1} / {stepCount}
              </p>

              <h2
                id="cfg-tour-title"
                className="mt-1.5 font-sans text-[1.125rem] font-medium uppercase tracking-[0.03375rem] text-white"
              >
                {step.title}
              </h2>

              <p
                id="cfg-tour-body"
                className="mt-1 text-xs leading-normal text-white/70"
              >
                {step.body}
              </p>

              <div className="mt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  className="cursor-pointer px-1 py-1 font-sans text-[0.625rem] font-medium tracking-[0.01875rem] text-[#F2E9D8] uppercase transition"
                  onClick={onSkip}
                >
                  Skip
                </button>
                <button
                  type="button"
                  className="cursor-pointer rounded-full bg-[#00272D] px-4 py-2.5 font-sans text-[0.625rem] font-medium tracking-[0.01875rem] text-[#F2E9D8] uppercase transition hover:bg-[#00272D]/90"
                  onClick={onNext}
                >
                  {isLast ? step.nextLabel : "Next"}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default ConfiguratorTour;
