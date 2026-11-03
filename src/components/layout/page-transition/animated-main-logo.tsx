"use client";

import { motion } from "motion/react";
import AtelierLogo from "@/components/icons/atelier-logo";
import ByWord from "@/components/icons/by-word";
import ReefWord from "@/components/icons/reef-word";

interface Props {
  reverse?: boolean;
  className?: string;
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const AnimatedMainLogo = ({ reverse = false, className }: Props) => {
  return (
    <motion.div
      className={`flex flex-col items-center ${className ?? ""}`}
      initial={false}
    >
      {/* Atelier wordmark */}
      <motion.div
        initial={{ opacity: 0, y: reverse ? 0 : 24, filter: "blur(8px)" }}
        animate={{
          opacity: reverse ? 0 : 1,
          y: reverse ? -24 : 0,
          filter: reverse ? "blur(8px)" : "blur(0px)",
        }}
        transition={{
          duration: 0.55,
          ease: EASE,
          delay: reverse ? 0.15 : 0,
        }}
      >
        <AtelierLogo className="h-10.5 w-auto text-[#F5F0E8] sm:h-13" />
      </motion.div>

      {/* "by REEF" */}
      <motion.div
        className="mt-2 flex flex-col items-center gap-1.5"
        initial={{ opacity: 0, y: reverse ? 0 : 16 }}
        animate={{
          opacity: reverse ? 0 : 1,
          y: reverse ? -16 : 0,
        }}
        transition={{
          duration: 0.5,
          ease: EASE,
          delay: reverse ? 0 : 0.18,
        }}
      >
        <ByWord className="h-2.75 w-auto text-[#F5F0E8]/opacity-80" />
        <ReefWord className="h-3.25 w-auto text-[#F5F0E8]" />
      </motion.div>
    </motion.div>
  );
};

export default AnimatedMainLogo;
