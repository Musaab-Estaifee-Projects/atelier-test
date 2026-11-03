"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
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

function getBreakpoint() {
  if (typeof window === "undefined") {
    return { isMd: false, isLg: false };
  }
  return {
    isMd: window.matchMedia("(min-width: 768px)").matches,
    isLg: window.matchMedia("(min-width: 1024px)").matches,
  };
}

function useBreakpoint() {
  const [bp, setBp] = useState(getBreakpoint);

  useEffect(() => {
    const md = window.matchMedia("(min-width: 768px)");
    const lg = window.matchMedia("(min-width: 1024px)");
    const update = () => setBp({ isMd: md.matches, isLg: lg.matches });
    update();
    md.addEventListener("change", update);
    lg.addEventListener("change", update);
    return () => {
      md.removeEventListener("change", update);
      lg.removeEventListener("change", update);
    };
  }, []);

  return bp;
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

const PageLoader = ({ active, onComplete }: PageLoaderProps) => {
  const { isMd, isLg } = useBreakpoint();
  const layout = layoutFromBp(isMd, isLg);

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

  // 4 second timer
  useEffect(() => {
    if (!active) return;

    const timer = setTimeout(() => {
      onComplete?.();
    }, 4000);

    return () => clearTimeout(timer);
  }, [active, onComplete]);

  const corners = [
    { left: layout.vLeft, top: layout.hTop },
    { left: layout.vRight, top: layout.hTop },
    { left: layout.vLeft, top: layout.hBottom },
    { left: layout.vRight, top: layout.hBottom },
  ];

  return (
    <AnimatePresence mode="wait">
      {active && (
        <motion.div
          key="page-loader"
          initial={{ opacity: 1, backgroundColor: "#00272D" }}
          animate={{
            opacity: 1,
            // backgroundColor: "#000000",
          }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 0.7, ease: [0.4, 0, 0.2, 1] },
            backgroundColor: {
              delay: 3.1,
              duration: 0.8,
              ease: EASE,
            },
          }}
          className="fixed inset-0 z-9999 flex flex-col items-center justify-center overflow-hidden pointer-events-auto"
          style={pageNoiseStyle(0.11)}
        >
          {/* Radial overlay */}
          <div
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              background:
                "radial-gradient(circle at center, rgba(0, 39, 45, 0.1) 0%, rgba(0, 0, 0, 0.2) 100%)",
            }}
          />

          {/* ───────────────────────────────────────────────
              STAGE 1–2 • Logo + "by REEF"
          ─────────────────────────────────────────────── */}
          <motion.div
            className="absolute left-1/2 flex flex-col items-center"
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
              initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
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

          {/* ───────────────────────────────────────────────
              STAGE 3 • Temporary center crosshair + star
          ─────────────────────────────────────────────── */}
          <motion.div
            className="absolute left-1/2 top-0 h-full w-px origin-center bg-[#f2e9d880]/15"
            style={{ x: "-50%" }}
            initial={{ scaleY: 0, opacity: 1 }}
            animate={{ scaleY: 1, opacity: 0 }}
            transition={{
              scaleY: { delay: 1.5, duration: 0.9, ease: EASE },
              opacity: { delay: 2.15, duration: 0.35, ease: [0.4, 0, 0.2, 1] },
            }}
          />
          <motion.div
            className="absolute left-0 top-1/2 h-px w-full origin-center bg-[#f2e9d880]/15"
            style={{ y: "-50%" }}
            initial={{ scaleX: 0, opacity: 1 }}
            animate={{ scaleX: 1, opacity: 0 }}
            transition={{
              scaleX: { delay: 1.5, duration: 0.9 },
              opacity: { delay: 2.15, duration: 0.35 },
            }}
          />

          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: [0, 1, 0], scale: [0.3, 1, 0.8] }}
            transition={{ delay: 1.8, duration: 0.8 }}
          >
            <Star className="h-5.5 w-5.5 text-[#F5F0E8]" />
          </motion.div>

          {/* ───────────────────────────────────────────────
              STAGE 4 • Responsive outer guides + corner stars
              (same values as HomeIntro)
          ─────────────────────────────────────────────── */}
          {/* Vertical guides */}
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

          {/* Horizontal guides */}
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

          {/* Corner stars */}
          {corners.map((s, i) => (
            <motion.div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2 pl-px pt-px"
              initial={{ left: "50%", top: "50%", opacity: 0, scale: 0.2 }}
              animate={{ left: s.left, top: s.top, opacity: 1, scale: 1 }}
              transition={{ delay: 2.25, duration: 0.8, ease: EASE }}
            >
              <Star className="h-4 w-4 text-[#F5F0E8]/90 md:h-5.5 md:w-5.5" />
            </motion.div>
          ))}

          {/* ───────────────────────────────────────────────
              STAGE 5 • Headline
          ─────────────────────────────────────────────── */}
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
};

export default PageLoader;
