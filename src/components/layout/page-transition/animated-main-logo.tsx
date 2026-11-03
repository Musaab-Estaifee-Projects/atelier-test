"use client";

import { motion } from "motion/react";
import AtelierLogo from "@/components/icons/atelier-logo";
import ByWord from "@/components/icons/by-word";
import ReefWord from "@/components/icons/reef-word";

interface Props {
  /** idle = hidden; enter = fade in; exit = fade out (same instance — no remount flash). */
  phase?: "idle" | "enter" | "exit";
  /** @deprecated use phase — kept so older call sites keep typechecking if any remain */
  reverse?: boolean;
  className?: string;
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const AnimatedMainLogo = ({ phase, reverse = false, className }: Props) => {
  const resolved: "idle" | "enter" | "exit" =
    phase ?? (reverse ? "exit" : "enter");

  const show = resolved === "enter";
  const exiting = resolved === "exit";
  const hidden = resolved === "idle";

  return (
    <div
      className={`flex flex-col items-center ${hidden ? "opacity-0" : ""} ${className ?? ""}`}
      aria-hidden={hidden || undefined}
    >
      {/* Atelier wordmark */}
      <motion.div
        // initial={false}
        initial={{ filter: "blur(8px)" }}
        animate={{
          opacity: show ? 1 : 0,
          y: show ? 0 : exiting ? -24 : 24,
          filter: exiting ? "blur(8px)" : "blur(0px)",
        }}
        transition={{
          duration: 0.55,
          ease: EASE,
          delay: exiting ? 0.15 : show ? 0 : 0,
        }}
      >
        <AtelierLogo className="h-10.5 w-auto text-[#F5F0E8] sm:h-13" />
      </motion.div>

      <motion.div
        className="mt-2 flex flex-col items-center gap-1.5"
        initial={false}
        animate={{
          opacity: show ? 1 : 0,
          y: show ? 0 : exiting ? -16 : 16,
        }}
        transition={{
          duration: 0.5,
          ease: EASE,
          delay: exiting ? 0 : show ? 0.18 : 0,
        }}
      >
        <ByWord className="h-2.75 w-auto text-[#F5F0E8]/opacity-80" />
        <ReefWord className="h-3.25 w-auto text-[#F5F0E8]" />
      </motion.div>
    </div>
  );
};

export default AnimatedMainLogo;
