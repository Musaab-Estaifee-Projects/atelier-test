"use client";

import { motion, AnimatePresence } from "motion/react";
import AnimatedMainLogo from "./animated-main-logo";

interface Props {
  active: boolean;
  logoPhase: "idle" | "enter" | "exit";
}

const DURATION = 1;

const ColumnTransition = ({ active, logoPhase }: Props) => {
  return (
    <AnimatePresence mode="wait">
      {active && (
        <div className="fixed inset-0 z-9999 pointer-events-auto overflow-hidden ultra:inset-[0vmax]!">
          <motion.div
            initial={{
              scaleX: 0,
              transformOrigin: "left",
            }}
            animate={{
              scaleX: 1,
              transformOrigin: "left",
            }}
            exit={{
              scaleX: 0,
              transformOrigin: "right",
            }}
            transition={{
              duration: DURATION,
              ease: [0.76, 0, 0.24, 1],
            }}
            className="absolute inset-0 bg-[#00272D] will-change-transform ultra:inset-[0vmax]!"
          />

          <div className="absolute inset-0 flex items-center justify-center ultra:inset-[0vmax]!">
            {logoPhase !== "idle" && (
              <AnimatedMainLogo reverse={logoPhase === "exit"} />
            )}
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ColumnTransition;
