"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import AtelierLogo from "@/components/icons/atelier-logo";
import ByWord from "@/components/icons/by-word";
import ReefWord from "@/components/icons/reef-word";
import Star from "@/components/icons/star";
import { pageNoiseStyle } from "@/lib/ui/page-noise";

interface PageLoaderProps {
  active: boolean;
  onComplete?: () => void;
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const FADE_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

/** Lighter noise tile — same look, fewer SVG filter octaves / cached style. */
const LOADER_NOISE = pageNoiseStyle(0.11, { octaves: 2, size: 180 });

const RADIAL_OVERLAY: CSSProperties = {
  background:
    "radial-gradient(circle at center, rgba(0, 39, 45, 0.1) 0%, rgba(0, 0, 0, 0.2) 100%)",
};

function readBreakpoint() {
  if (typeof window === "undefined") {
    return { isMd: false, isLg: false };
  }
  return {
    isMd: window.matchMedia("(min-width: 768px)").matches,
    isLg: window.matchMedia("(min-width: 1024px)").matches,
  };
}

function layoutFromBp(isMd: boolean, isLg: boolean) {
  return {
    vLeft: isLg ? "28%" : "12%",
    vRight: isLg ? "72%" : "88%",
    hTop: isLg ? "32%" : "30%",
    hBottom: isLg ? "68%" : "70%",
    logoTopFinal: isLg ? "16.666%" : isMd ? "16.666%" : "4.5%",
    logoScaleFinal: isLg ? 0.75 : 0.65,
  };
}

/**
 * Freeze breakpoint for the whole loader run so mid-animation resize/mq
 * updates don't restart motion values (jank + flash).
 */
function useLockedLayout(active: boolean) {
  const locked = useRef(layoutFromBp(false, false));
  // eslint-disable-next-line react-hooks/refs
  const [layout, setLayout] = useState(locked.current);

  useEffect(() => {
    if (!active) return;
    const bp = readBreakpoint();
    const next = layoutFromBp(bp.isMd, bp.isLg);
    locked.current = next;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLayout(next);
  }, [active]);

  return layout;
}

const PageLoader = memo(function PageLoader({
  active,
  onComplete,
}: PageLoaderProps) {
  const layout = useLockedLayout(active);
  const onCompleteRef = useRef(onComplete);
  // eslint-disable-next-line react-hooks/refs
  onCompleteRef.current = onComplete;

  const corners = useMemo(
    () => [
      { left: layout.vLeft, top: layout.hTop },
      { left: layout.vRight, top: layout.hTop },
      { left: layout.vLeft, top: layout.hBottom },
      { left: layout.vRight, top: layout.hBottom },
    ],
    [layout],
  );

  // Lock scroll
  useEffect(() => {
    if (!active) return;

    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.documentElement.style.overflowY = "hidden";

    return () => {
      document.body.style.position = "";
      document.body.style.width = "";
      document.documentElement.style.overflowY = "";
      window.scrollTo(0, 0);
    };
  }, [active]);

  // 4s timer — stable via ref so identity churn doesn't reset the clock
  useEffect(() => {
    if (!active) return;

    const timer = window.setTimeout(() => {
      onCompleteRef.current?.();
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [active]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="page-loader"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 0.7, ease: FADE_EASE },
          }}
          className="fixed inset-0 z-9999 flex flex-col items-center justify-center overflow-hidden pointer-events-auto bg-[#00272D]"
          style={LOADER_NOISE}
        >
          <div
            className="pointer-events-none absolute inset-0 z-0"
            style={RADIAL_OVERLAY}
          />

          {/* STAGE 1–2 • Logo + "by REEF" — opacity/transform only (no blur). */}
          <motion.div
            className="absolute left-1/2 flex flex-col items-center will-change-transform"
            initial={{ x: "-50%", top: "50%", y: "-50%", scale: 1.2 }}
            animate={{
              x: "-50%",
              top: ["50%", "50%", "30%", layout.logoTopFinal],
              y: "-50%",
              scale: [1.2, 1.2, 0.9, layout.logoScaleFinal],
            }}
            transition={{
              duration: 2.9,
              times: [0, 0.42, 0.72, 1],
              ease: EASE,
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.15,
                duration: 0.8,
                ease: EASE,
              }}
            >
              <AtelierLogo className="h-10.5 w-auto text-[#F5F0E8] sm:h-13" />
            </motion.div>

            <motion.div
              className="mt-2 flex flex-col items-center gap-1.5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.55,
                duration: 0.6,
                ease: EASE,
              }}
            >
              <ByWord className="h-2.75 w-auto text-[#F5F0E8]/opacity-80" />
              <ReefWord className="h-3.25 w-auto text-[#F5F0E8]" />
            </motion.div>
          </motion.div>

          {/* STAGE 3 • Center crosshair + star */}
          <motion.div
            className="absolute left-1/2 top-0 h-full w-px origin-center bg-[#f2e9d880]/15 will-change-transform"
            style={{ x: "-50%" }}
            initial={{ scaleY: 0, opacity: 1 }}
            animate={{ scaleY: 1, opacity: 0 }}
            transition={{
              scaleY: { delay: 1.5, duration: 0.9, ease: EASE },
              opacity: { delay: 2.15, duration: 0.35, ease: FADE_EASE },
            }}
          />
          <motion.div
            className="absolute left-0 top-1/2 h-px w-full origin-center bg-[#f2e9d880]/15 will-change-transform"
            style={{ y: "-50%" }}
            initial={{ scaleX: 0, opacity: 1 }}
            animate={{ scaleX: 1, opacity: 0 }}
            transition={{
              scaleX: { delay: 1.5, duration: 0.9, ease: EASE },
              opacity: { delay: 2.15, duration: 0.35, ease: FADE_EASE },
            }}
          />

          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 will-change-transform"
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: [0, 1, 0], scale: [0.3, 1, 0.8] }}
            transition={{ delay: 1.8, duration: 0.8, ease: EASE }}
          >
            <Star className="h-5.5 w-5.5 text-[#F5F0E8]" />
          </motion.div>

          {/* STAGE 4 • Outer guides + corner stars */}
          <motion.div
            className="absolute top-0 h-full w-px bg-[#f2e9d880]/18"
            initial={{ left: "50%", scaleY: 0, opacity: 0 }}
            animate={{ left: layout.vLeft, scaleY: 1, opacity: 1 }}
            transition={{ delay: 2.25, duration: 0.8, ease: EASE }}
          />
          <motion.div
            className="absolute top-0 h-full w-px bg-[#f2e9d880]/18"
            initial={{ left: "50%", scaleY: 0, opacity: 0 }}
            animate={{ left: layout.vRight, scaleY: 1, opacity: 1 }}
            transition={{ delay: 2.25, duration: 0.8, ease: EASE }}
          />

          <motion.div
            className="absolute left-0 h-px w-full bg-[#f2e9d880]/18"
            initial={{ top: "50%", scaleX: 0, opacity: 0 }}
            animate={{ top: layout.hTop, scaleX: 1, opacity: 1 }}
            transition={{ delay: 2.25, duration: 0.8, ease: EASE }}
          />
          <motion.div
            className="absolute left-0 h-px w-full bg-[#f2e9d880]/18"
            initial={{ top: "50%", scaleX: 0, opacity: 0 }}
            animate={{ top: layout.hBottom, scaleX: 1, opacity: 1 }}
            transition={{ delay: 2.25, duration: 0.8, ease: EASE }}
          />

          {corners.map((s, i) => (
            <motion.div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2 pl-px pt-px will-change-transform"
              initial={{ left: "50%", top: "50%", opacity: 0, scale: 0.2 }}
              animate={{ left: s.left, top: s.top, opacity: 1, scale: 1 }}
              transition={{ delay: 2.25, duration: 0.8, ease: EASE }}
            >
              <Star className="h-4 w-4 text-[#F5F0E8]/90 md:h-5.5 md:w-5.5" />
            </motion.div>
          ))}

          {/* STAGE 5 • Headline */}
          <motion.div
            className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.5, duration: 0.7, ease: EASE }}
          >
            <span className="font-baskerville text-[11px] font-medium tracking-[0.28em] text-[#F5F0E8]/70">
              STEP INTO
            </span>
            <span className="font-snell-roundhand text-[42px] leading-none text-[#F5F0E8] sm:text-[52px]">
              Personalized
            </span>
            <span className="mt-2 font-baskerville text-[15px] tracking-[0.22em] text-[#F5F0E8]">
              LUXURY
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default PageLoader;
