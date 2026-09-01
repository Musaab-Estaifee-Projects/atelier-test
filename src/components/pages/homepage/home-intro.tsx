"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AtelierLogo from "@/components/icons/atelier-logo";
import ByWord from "@/components/icons/by-word";
import ReefWord from "@/components/icons/reef-word";
import Star from "@/components/icons/star";
import Link from "next/link";
import { pageNoiseStyle } from "@/lib/ui/page-noise";
import { RoundedRect } from "@/components/shared/rounded-rect";

const FH = 808;
const ROW_T = 273;
const ROW_M = 262;
const Y_BOTTOM = `${((ROW_T + ROW_M + ROW_T / 2) / FH) * 100}%`;

export default function HomeIntro() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);

  const handleNavigate = (href: string) => {
    setIsVisible(false);

    setTimeout(() => {
      router.push(href);
    }, 500);
    // 900
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key="home-intro"
          initial={{ opacity: 1, backgroundColor: "#00272D" }}
          animate={{
            opacity: 1,
            backgroundColor: "#000000",
          }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 0.85, ease: [0.4, 0, 0.2, 1] },
            backgroundColor: {
              delay: 3.8,
              duration: 1.0,
              ease: [0.22, 1, 0.36, 1],
            },
          }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
          style={pageNoiseStyle(0.12)}
        >
          {/* Radial overlay */}
          <div
            className="pointer-events-none absolute inset-0 z-0 bg-transparent!"
            style={{
              background:
                "radial-gradient(circle at center, rgba(0, 39, 45, 0.1) 0%, rgba(0, 0, 0, 0.2) 100%)",
            }}
          />

          {/* ───────────────────────────────────────────────
              STAGE 1–2 • Logo + "by REEF" (center → top-center of 3*3)
          ─────────────────────────────────────────────── */}
          <motion.div
            className="absolute left-1/2 flex flex-col items-center"
            initial={{ x: "-50%", top: "50%", y: "-50%", scale: 1.2 }}
            animate={{
              x: "-50%",
              top: ["50%", "50%", "30%", "16.666%"],
              y: "-50%",
              scale: [1.2, 1.2, 0.9, 0.75],
            }}
            transition={{
              duration: 3.5,
              times: [0, 0.5, 0.76, 1],
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {/* Atelier wordmark */}
            <motion.div
              initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              <AtelierLogo className="h-10.5 w-auto text-[#F5F0E8] sm:h-13" />
            </motion.div>

            {/* "by REEF" */}
            <motion.div
              className="mt-2 flex flex-col items-center gap-1.5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.55,
                duration: 0.7,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <ByWord className="h-2.75 w-auto text-[#F5F0E8]/opacity-80" />
              <ReefWord className="h-3.25 w-auto text-[#F5F0E8]" />
            </motion.div>
          </motion.div>

          {/* ───────────────────────────────────────────────
              STAGE 3 • Crosshair + central star
          ─────────────────────────────────────────────── */}
          {/* Vertical line */}
          <motion.div
            className="absolute left-1/2 top-0 h-full w-px origin-center bg-[#f2e9d880]/15"
            style={{ x: "-50%" }}
            initial={{ scaleY: 0, opacity: 1 }}
            animate={{ scaleY: 1, opacity: 0 }}
            transition={{
              scaleY: { delay: 1.85, duration: 1.1, ease: [0.22, 1, 0.36, 1] },
              opacity: { delay: 2.55, duration: 0.35, ease: [0.4, 0, 0.2, 1] },
            }}
          />

          {/* Horizontal line */}
          <motion.div
            className="absolute left-0 top-1/2 h-px w-full origin-center bg-[#f2e9d880]/15"
            style={{ y: "-50%" }}
            initial={{ scaleX: 0, opacity: 1 }}
            animate={{ scaleX: 1, opacity: 0 }}
            transition={{
              scaleX: { delay: 1.85, duration: 1.1 },
              opacity: { delay: 2.55, duration: 0.35 },
            }}
          />

          {/* Central star */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            // initial={{ opacity: 0 }}
            initial={{ opacity: 0, scale: 0.3 }}
            // animate={{ opacity: [0, 1, 0] }}
            animate={{ opacity: [0, 1, 0], scale: [0.3, 1, 0.8] }}
            transition={{
              delay: 2.15,
              duration: 0.9,
              // times: [0, 0.22, 1],
              // ease: [0.22, 1, 0.36, 1],
            }}
          >
            <Star className="h-5.5 w-5.5 text-[#F5F0E8]" />
          </motion.div>

          {/* ───────────────────────────────────────────────
              STAGE 4  •  Lines + stars expand outward from center
          ─────────────────────────────────────────────── */}
          {/* Outer vertical guides – travel from center to its final positions */}
          <motion.div
            className="absolute top-0 h-full w-px bg-[#f2e9d880]/18 -z-9999"
            initial={{ left: "50%", scaleY: 0, opacity: 0 }}
            animate={{ left: "28%", scaleY: 1, opacity: 1 }}
            transition={{
              delay: 2.65,
              duration: 0.95,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
          <motion.div
            className="absolute top-0 h-full w-px bg-[#f2e9d880]/18 -z-9999"
            initial={{ left: "50%", scaleY: 0, opacity: 0 }}
            animate={{ left: "72%", scaleY: 1, opacity: 1 }}
            transition={{
              delay: 2.65,
              duration: 0.95,
              ease: [0.22, 1, 0.36, 1],
            }}
          />

          {/* Outer horizontal guides – travel from center to its final positions */}
          <motion.div
            className="absolute left-0 h-px w-full bg-[#f2e9d880]/18 -z-9999"
            initial={{ top: "50%", scaleX: 0, opacity: 0 }}
            animate={{ top: "32%", scaleX: 1, opacity: 1 }}
            transition={{
              delay: 2.65,
              duration: 0.95,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
          <motion.div
            className="absolute left-0 h-px w-full bg-[#f2e9d880]/18 -z-9999"
            initial={{ top: "50%", scaleX: 0, opacity: 0 }}
            animate={{ top: "68%", scaleX: 1, opacity: 1 }}
            transition={{
              delay: 2.65,
              duration: 0.95,
              ease: [0.22, 1, 0.36, 1],
            }}
          />

          {[
            { left: "28%", top: "32%" },
            { left: "72%", top: "32%" },
            { left: "28%", top: "68%" },
            { left: "72%", top: "68%" },
          ].map((s, i) => (
            <motion.div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2 pl-px pt-px"
              initial={{ left: "50%", top: "50%", opacity: 0, scale: 0.2 }}
              animate={{ left: s.left, top: s.top, opacity: 1, scale: 1 }}
              transition={{
                // delay: 2.85,
                // duration: 0.7,
                delay: 2.65,
                duration: 0.95,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Star className="h-5.5 w-5.5 text-[#F5F0E8]/90" />
            </motion.div>
          ))}

          {/* ───────────────────────────────────────────────
              STAGE 5  •  Headline
          ─────────────────────────────────────────────── */}
          <motion.div
            className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              // delay: 3.15,
              delay: 2.95,
              duration: 0.85,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <span className="font-libre-baskerville text-[11px] font-medium tracking-[0.28em] text-[#F5F0E8]/70">
              STEP INTO
            </span>
            <span className="font-snell-roundhand text-[28px] min-[429px]:text-[34px] sm:text-[42px] leading-none text-[#F5F0E8] md:text-[52px]">
              Personalized
            </span>
            <span className="mt-2 font-libre-baskerville text-[15px] tracking-[0.22em] text-[#F5F0E8]">
              LUXURY
            </span>
          </motion.div>

          {/* ───────────────────────────────────────────────
              STAGE 6  •  CTA button
          ─────────────────────────────────────────────── */}
          {/* <motion.div
            className="absolute bottom-[10%]! left-1/2 -translate-x-1/2 min-[2000px]:bottom-[11%]"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: 3.55,
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <RoundedRect
              as="button"
              onClick={() => handleNavigate("/projects")}
              className="relative z-10 mx-8 cursor-pointer border-none py-5 font-libre-baskerville text-[12px] uppercase tracking-[0.32625rem] text-white sm:px-14 sm:text-[13px] xl:text-lg lg:py-[2vmax] lg:w-[40vw]! lg:max-w-800! bg-transparent"
              // Animate the shape fill itself (not a rectangular background)
              initial={{ "--shape-fill": "rgba(20, 62, 71, 0.4)" }}
              animate={{ "--shape-fill": "rgba(29, 60, 39, 0.1)" }}
              transition={{
                "--shape-fill": {
                  delay: 3.8,
                  duration: 1.0,
                  ease: [0.22, 1, 0.36, 1],
                },
                opacity: { delay: 3.85, duration: 0.5 },
              }}
              stroke="rgba(255,255,255,0.4)"
              radius={{
                base: 12,
                sm: 14,
                md: 16,
                lg: 24,
              }}
              noiseOpacity={0.13}
            >
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  delay: 4.2,
                  duration: 0.7,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                Start Your Experience
              </motion.span>
            </RoundedRect>
          </motion.div> */}

          {/* ───────────────────────────────────────────────
    STAGE 6  •  CTA button  →  centered in [3,2]
─────────────────────────────────────────────── */}
          <motion.div
            className="absolute left-1/2 top-[84%] -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: 3.55,
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <RoundedRect
              as="button"
              onClick={() => handleNavigate("/projects")}
              className="relative z-10 mx-8 cursor-pointer border-none py-6 sm:py-8 font-libre-baskerville text-[12px] uppercase tracking-[0.32625rem] text-white sm:px-14 sm:text-[13px] xl:text-lg lg:py-[2.5vmax] lg:w-[40vw]! lg:max-w-800! bg-transparent"
              initial={{ "--shape-fill": "rgba(20, 62, 71, 0.4)" }}
              animate={{ "--shape-fill": "rgba(29, 60, 39, 0.1)" }}
              transition={{
                "--shape-fill": {
                  delay: 3.8,
                  duration: 1.0,
                  ease: [0.22, 1, 0.36, 1],
                },
                opacity: { delay: 3.85, duration: 0.5 },
              }}
              stroke="rgba(255,255,255,0.4)"
              radius={{
                base: 12,
                sm: 14,
                md: 16,
                lg: 24,
              }}
              noiseOpacity={0.13}
            >
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  delay: 4.2,
                  duration: 0.7,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                Start Your Experience
              </motion.span>
            </RoundedRect>
          </motion.div>
          {/* ───────────────────────────────────────────────
              STAGE 7  •  paragraph
          ─────────────────────────────────────────────── */}
          <motion.p
            className="absolute hidden md:block left-[86%] top-[84%] max-w-50 -translate-x-1/2 -translate-y-1/2 font-general-sans text-[8px] leading-relaxed text-white/60 sm:text-sm lg:max-w-67.5"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 3.9,
              duration: 0.75,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            Where ideas, insights, and stories come together. Explore the latest
            from REEF, market perspectives, design thinking, and updates across
            our developments.
          </motion.p>

          <motion.nav
            className="absolute top-[3%] right-[2%] z-10 flex gap-6 font-general-sans text-[10px] uppercase tracking-[0.22em] text-white"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 4.5,
              duration: 0.6,
              ease: "easeOut",
            }}
          >
            {[
              { href: "/about", label: "ABOUT" },
              { href: "/projects", label: "PROJECTS" },
              { href: "/reference-number", label: "REFERENCE NUMBER" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigate(href);
                }}
              >
                {label}
              </Link>
            ))}
          </motion.nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
