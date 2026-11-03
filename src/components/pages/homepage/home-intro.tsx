"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import AtelierLogo from "@/components/icons/atelier-logo";
import ByWord from "@/components/icons/by-word";
import ReefWord from "@/components/icons/reef-word";
import Star from "@/components/icons/star";
import { pageNoiseStyle } from "@/lib/ui/page-noise";
import { RoundedRect } from "@/components/shared/rounded-rect";
import SiteNav from "@/components/layout/site-nav";
import { Volume2, VolumeOff } from "lucide-react";

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

const INTRO_LOOP_VIDEO = "/real-estate-video.mp4";
const INTRO_DONE_MS = 5200;
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const SNAP = { duration: 0 } as const;

function staged(
  introDone: boolean,
  delay: number,
  duration: number,
  ease: [number, number, number, number] = EASE,
) {
  return introDone ? SNAP : { delay, duration, ease };
}

const SoundIcon = ({ on }: { on: boolean }) => (
  <span
    className="relative inline-flex size-5 items-center justify-center"
    aria-hidden
  >
    <AnimatePresence mode="wait" initial={false}>
      {on ? (
        <motion.span
          key="on"
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.7, rotate: -12 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.7, rotate: 12 }}
          transition={{ duration: 0.28, ease: EASE }}
        >
          <Volume2 className="size-5" strokeWidth={1.1} />
        </motion.span>
      ) : (
        <motion.span
          key="off"
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.7, rotate: 12 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.7, rotate: -12 }}
          transition={{ duration: 0.28, ease: EASE }}
        >
          <VolumeOff className="size-5" strokeWidth={1.1} />
        </motion.span>
      )}
    </AnimatePresence>
  </span>
);

type Layout = ReturnType<typeof layoutFromBp>;

const VideoLayer = ({
  introDone,
  videoRef,
}: {
  introDone: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}) => {
  return (
    <>
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: introDone ? 1 : 0 }}
        transition={{ duration: 1.2, ease: EASE }}
        aria-hidden
      >
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          src={INTRO_LOOP_VIDEO}
          muted
          playsInline
          loop
          preload="auto"
        />
      </motion.div>

      <motion.div
        className="pointer-events-none absolute inset-0 z-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: introDone ? 1 : 0 }}
        transition={{ duration: 1.4, ease: EASE }}
        style={{
          background: `
            radial-gradient(65.55% 100% at 50.2% 100%, rgba(0, 22, 26, 0.32) 0%, rgba(0, 22, 26, 0.85) 100%),
            linear-gradient(0deg, rgba(0, 39, 45, 0.50) 0%, rgba(0, 39, 45, 0.50) 100%)
          `,
          backgroundBlendMode: "normal, multiply",
        }}
        aria-hidden
      />
    </>
  );
};

const SoundToggle = ({
  introDone,
  soundOn,
  onToggle,
}: {
  introDone: boolean;
  soundOn: boolean;
  onToggle: () => void;
}) => {
  return (
    <AnimatePresence>
      {introDone && (
        <motion.button
          key="sound-toggle"
          type="button"
          onClick={onToggle}
          aria-label={soundOn ? "Mute video" : "Unmute video"}
          aria-pressed={soundOn}
          className="absolute top-[1%] max-[475px]:left-0.5 left-[2%] sm:left-[3%] z-20 flex h-10 w-10 items-center justify-center text-white/90 transition-colors hover:text-white"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
        >
          <SoundIcon on={soundOn} />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

// For stage 1 and 2
const LogoStage = ({
  introDone,
  logoTopFinal,
  logoScaleFinal,
}: {
  introDone: boolean;
  logoTopFinal: string;
  logoScaleFinal: number;
}) => {
  return (
    <motion.div
      className="absolute left-1/2 z-2 flex flex-col items-center"
      initial={{ x: "-50%", top: "50%", y: "-50%", scale: 1.2 }}
      animate={{
        x: "-50%",
        top: introDone ? logoTopFinal : ["50%", "50%", "30%", logoTopFinal],
        y: "-50%",
        scale: introDone ? logoScaleFinal : [1.2, 1.2, 0.9, logoScaleFinal],
      }}
      transition={
        introDone
          ? SNAP
          : { duration: 3.5, times: [0, 0.5, 0.76, 1], ease: EASE }
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={introDone ? SNAP : { duration: 0.9, ease: EASE }}
      >
        <AtelierLogo className="h-[2.1rem] w-auto text-[#F5F0E8] sm:h-13" />
      </motion.div>

      <motion.div
        className="mt-2 flex flex-col items-center gap-1.5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={staged(introDone, 0.55, 0.7)}
      >
        <ByWord className="h-2.75 w-auto text-[#F5F0E8]/opacity-80" />
        <ReefWord className="h-3.25 w-auto text-[#F5F0E8]" />
      </motion.div>
    </motion.div>
  );
};

// For stage 3
const CrosshairStage = () => {
  return (
    <>
      <motion.div
        className="absolute left-1/2 top-0 z-2 h-full w-px origin-center bg-[#f2e9d880]/15"
        style={{ x: "-50%" }}
        initial={{ scaleY: 0, opacity: 1 }}
        animate={{ scaleY: 1, opacity: 0 }}
        transition={{
          scaleY: { delay: 1.85, duration: 1.1, ease: EASE },
          opacity: { delay: 2.55, duration: 0.35, ease: [0.4, 0, 0.2, 1] },
        }}
      />
      <motion.div
        className="absolute left-0 top-1/2 z-2 h-px w-full origin-center bg-[#f2e9d880]/15"
        style={{ y: "-50%" }}
        initial={{ scaleX: 0, opacity: 1 }}
        animate={{ scaleX: 1, opacity: 0 }}
        transition={{
          scaleX: { delay: 1.85, duration: 1.1 },
          opacity: { delay: 2.55, duration: 0.35 },
        }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 z-2 -translate-x-1/2 -translate-y-1/2"
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: [0, 1, 0], scale: [0.3, 1, 0.8] }}
        transition={{ delay: 2.15, duration: 0.9 }}
      >
        <Star className="h-5.5 w-5.5 text-[#F5F0E8]" />
      </motion.div>
    </>
  );
};

// For stage 4
const GuidesStage = ({
  layout,
  guideTransition,
}: {
  layout: Layout;
  guideTransition:
    | { duration: number }
    | {
        delay: number;
        duration: number;
        ease: [number, number, number, number];
      };
}) => {
  const { vLeft, vRight, hTop, hBottom } = layout;
  const corners = [
    { left: vLeft, top: hTop },
    { left: vRight, top: hTop },
    { left: vLeft, top: hBottom },
    { left: vRight, top: hBottom },
  ];

  return (
    <>
      <motion.div
        className="absolute top-0 z-2 h-full w-px bg-[#f2e9d880]/18"
        initial={{ left: "50%", scaleY: 0, opacity: 0 }}
        animate={{ left: vLeft, scaleY: 1, opacity: 1 }}
        transition={guideTransition}
      />
      <motion.div
        className="absolute top-0 z-2 h-full w-px bg-[#f2e9d880]/18"
        initial={{ left: "50%", scaleY: 0, opacity: 0 }}
        animate={{ left: vRight, scaleY: 1, opacity: 1 }}
        transition={guideTransition}
      />
      <motion.div
        className="absolute left-0 z-2 h-px w-full bg-[#f2e9d880]/18"
        initial={{ top: "50%", scaleX: 0, opacity: 0 }}
        animate={{ top: hTop, scaleX: 1, opacity: 1 }}
        transition={guideTransition}
      />
      <motion.div
        className="absolute left-0 z-2 h-px w-full bg-[#f2e9d880]/18"
        initial={{ top: "50%", scaleX: 0, opacity: 0 }}
        animate={{ top: hBottom, scaleX: 1, opacity: 1 }}
        transition={guideTransition}
      />

      {corners.map((s, i) => (
        <motion.div
          key={i}
          className="absolute z-2 -translate-x-1/2 -translate-y-1/2 pl-px pt-px"
          initial={{ left: "50%", top: "50%", opacity: 0, scale: 0.2 }}
          animate={{ left: s.left, top: s.top, opacity: 1, scale: 1 }}
          transition={guideTransition}
        >
          <Star className="h-4 w-4 text-[#F5F0E8]/90 md:h-5.5 md:w-5.5" />
        </motion.div>
      ))}
    </>
  );
};

// For stage 5
const HeadlineStage = ({ introDone }: { introDone: boolean }) => {
  return (
    <motion.div
      className="absolute left-1/2 top-1/2 z-2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center px-4 text-center"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={staged(introDone, 2.95, 0.85)}
    >
      <span className="font-baskerville text-[11px] font-medium tracking-[0.33256rem] text-[#F5F0E8]/70 sm:tracking-[0.28em]">
        STEP INTO
      </span>
      <span className="font-snell-roundhand text-[2.90775rem] leading-none text-[#F5F0E8] sm:text-[42px] md:text-[52px]">
        Personalized
      </span>
      <span className="mt-2 font-baskerville text-[15px] tracking-[0.22em] text-[#F5F0E8]">
        LUXURY
      </span>
    </motion.div>
  );
};

// For stage 6
const CtaStage = ({
  introDone,
  onNavigate,
}: {
  introDone: boolean;
  onNavigate: (href: string) => void;
}) => {
  return (
    <>
      <motion.div
        className="absolute left-1/2 top-[85.5%] z-2 flex w-full -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center px-4"
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={staged(introDone, 3.55, 0.7)}
      >
        <RoundedRect
          as="button"
          data-transition-href="/projects"
          // onClick={() => onNavigate("/projects")}
          className="relative z-10 mx-auto cursor-pointer border-none bg-transparent px-6 py-7 font-baskerville text-[0.87944rem]! uppercase tracking-[0.14069rem] text-white sm:px-14 sm:py-8 sm:text-[13px] md:tracking-[0.32625rem] lg:w-[40vw]! lg:max-w-800! lg:py-[2.5vmax] xl:text-lg"
          initial={{ "--shape-fill": "rgba(20, 62, 71, 0.4)" }}
          animate={{ "--shape-fill": "rgba(29, 60, 39, 0.1)" }}
          transition={
            introDone
              ? SNAP
              : {
                  "--shape-fill": { delay: 3.8, duration: 1.0, ease: EASE },
                  opacity: { delay: 3.85, duration: 0.5 },
                }
          }
          stroke="rgba(255,255,255,0.4)"
          radius={{ base: 12, sm: 14, md: 16, lg: 18 }}
          noiseOpacity={0.13}
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={staged(introDone, 4.2, 0.7)}
          >
            Start Your Experience
          </motion.span>
        </RoundedRect>

        <motion.p
          className="mt-5 max-w-68 text-center font-general-sans text-[0.625rem] leading-relaxed text-white/60 sm:mt-6 sm:max-w-[18rem] sm:text-sm md:max-w-88 lg:hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={staged(introDone, 3.9, 0.75)}
        >
          Where ideas, insights, and stories come together. Explore the latest
          from REEF, market perspectives, design thinking, and updates across
          our developments.
        </motion.p>
      </motion.div>

      <motion.p
        className="absolute top-[85.5%] left-[86%] z-2 hidden max-w-50 -translate-x-1/2 -translate-y-1/2 font-general-sans text-[8px] leading-relaxed text-white/60 sm:text-sm lg:block lg:max-w-67.5"
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={staged(introDone, 3.9, 0.75)}
      >
        Where ideas, insights, and stories come together. Explore the latest
        from REEF, market perspectives, design thinking, and updates across our
        developments.
      </motion.p>
    </>
  );
};

const HomeIntro = () => {
  const router = useRouter();
  const { isMd, isLg } = useBreakpoint();
  const [isVisible, setIsVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [introLayout] = useState(() => layoutFromBp(isMd, isLg));
  const liveLayout = layoutFromBp(isMd, isLg);
  const animLayout = introDone ? liveLayout : introLayout;

  const guideTransition = introDone
    ? SNAP
    : { delay: 2.65, duration: 0.95, ease: EASE };

  useEffect(() => {
    const t = window.setTimeout(() => setIntroDone(true), INTRO_DONE_MS);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !soundOn;
    el.defaultMuted = !soundOn;
    el.volume = soundOn ? 1 : 0;
    if (introDone) {
      el.play()?.catch(() => {});
    } else {
      el.pause();
    }
  }, [introDone, soundOn]);

  const handleNavigate = (href: string) => {
    setMenuOpen(false);

    // Only hide the intro if we are NOT going through the column transition
    // (for external links or special cases)
    if (!href.startsWith("/")) {
      setIsVisible(false);
      setTimeout(() => router.push(href), 50);
      return;
    }

    // For internal links the global PageTransition handler will do the work.
    // Just close the menu – do NOT set isVisible(false) here.
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    const el = videoRef.current;
    if (!el) return;
    el.muted = !next;
    el.defaultMuted = !next;
    el.volume = next ? 1 : 0;
    if (introDone) el.play()?.catch(() => {});
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key="home-intro"
          initial={{ opacity: 1, backgroundColor: "#00272D" }}
          animate={{
            opacity: 1,
            backgroundColor: `
              radial-gradient(65.55% 100% at 50.2% 100%, rgba(0, 22, 26, 0.32) 0%, rgba(0, 22, 26, 0.85) 100%),
              linear-gradient(0deg, rgba(0, 39, 45, 0.50) 0%, rgba(0, 39, 45, 0.50) 100%)
            `,
          }}
          exit={{ opacity: 1 }}
          transition={{
            opacity: { duration: 0 },
            backgroundColor: { delay: 3.8, duration: 1.0, ease: EASE },
          }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
          style={pageNoiseStyle(0.11)}
        >
          <VideoLayer introDone={introDone} videoRef={videoRef} />

          <SoundToggle
            introDone={introDone}
            soundOn={soundOn}
            onToggle={toggleSound}
          />

          <LogoStage
            introDone={introDone}
            logoTopFinal={animLayout.logoTopFinal}
            logoScaleFinal={animLayout.logoScaleFinal}
          />

          {!introDone && <CrosshairStage />}

          <GuidesStage layout={animLayout} guideTransition={guideTransition} />

          <HeadlineStage introDone={introDone} />

          <CtaStage introDone={introDone} onNavigate={handleNavigate} />

          <SiteNav
            variant="intro"
            introDone={introDone}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            onNavigate={handleNavigate}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HomeIntro;
