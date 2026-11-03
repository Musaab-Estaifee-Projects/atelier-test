"use client";

import { motion, AnimatePresence } from "motion/react";
import AnimatedMainLogo from "./animated-main-logo";

interface Props {
  active: boolean;
  logoPhase: "idle" | "enter" | "exit";
}

const DURATION = 1;
const EASE: [number, number, number, number] = [0.76, 0, 0.24, 1];

/**
 * Curtain is the AnimatePresence child (so exit scaleX actually runs).
 * Logo is a sibling layer — not scaled with the wipe, and kept mounted across
 * enter→exit so flipping reverse never remounts (that caused the flash).
 */
const ColumnTransition = ({ active, logoPhase }: Props) => {
  return (
    <>
      <AnimatePresence>
        {active ? (
          <motion.div
            key="column-curtain"
            className="fixed inset-0 z-9999 bg-[#00272D] pointer-events-auto will-change-transform ultra:inset-[0vmax]!"
            initial={{ scaleX: 0, transformOrigin: "left center" }}
            animate={{ scaleX: 1, transformOrigin: "left center" }}
            exit={{ scaleX: 0, transformOrigin: "right center" }}
            transition={{ duration: DURATION, ease: EASE }}
          />
        ) : null}
      </AnimatePresence>

      {active ? (
        <div className="fixed inset-0 z-9999 flex items-center justify-center pointer-events-none ultra:inset-[0vmax]!">
          <AnimatedMainLogo phase={logoPhase} />
        </div>
      ) : null}
    </>
  );
};

export default ColumnTransition;
