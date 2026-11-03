"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SITE_NAV_LINKS, isSiteNavActive } from "@/constants/site-nav";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const SNAP = { duration: 0 } as const;
const ACTIVE = "text-white font-medium";
const IDLE = "text-white/70";

function useIsMd() {
  const [isMd, setIsMd] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- match media after mount
    setMounted(true);
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsMd(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return { showDesktop: mounted && isMd };
}

const HamburgerIcon = ({ open }: { open: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="25"
    height="8"
    viewBox="0 0 25 8"
    fill="none"
    aria-hidden
  >
    <motion.path
      d="M0 0.5H24.5"
      stroke="white"
      strokeWidth={1}
      style={{ originX: "12.25px", originY: "0.5px" }}
      animate={open ? { rotate: 28, y: 3.25 } : { rotate: 0, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
    />
    <motion.path
      d="M0 7H24.5"
      stroke="white"
      strokeWidth={1}
      style={{ originX: "12.25px", originY: "7px" }}
      animate={open ? { rotate: -28, y: -3.25 } : { rotate: 0, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
    />
  </svg>
);

type SiteNavProps = {
  /** Home intro keeps the staged entrance; layout pages render immediately. */
  variant?: "intro" | "layout";
  introDone?: boolean;
  menuOpen?: boolean;
  setMenuOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  /** Home intro fade-out navigation. Omit on layout pages for normal links. */
  onNavigate?: (href: string) => void;
  className?: string;
};

/**
 * About / Projects / Reference Number.
 * Home: `variant="intro"`. Other routes: `variant="layout"` via SiteNavHost.
 */
export function SiteNav({
  variant = "layout",
  introDone = true,
  menuOpen: menuOpenProp,
  setMenuOpen: setMenuOpenProp,
  onNavigate,
  className,
}: SiteNavProps) {
  const pathname = usePathname() || "/";
  const { showDesktop } = useIsMd();
  const [menuOpenLocal, setMenuOpenLocal] = useState(false);
  const menuOpen = menuOpenProp ?? menuOpenLocal;
  const setMenuOpen = setMenuOpenProp ?? setMenuOpenLocal;

  const navTransition =
    variant === "intro" && !introDone
      ? { delay: 4.5, duration: 0.6, ease: "easeOut" as const }
      : SNAP;

  const go = (href: string) => {
    setMenuOpen(false);
    if (onNavigate) onNavigate(href);
  };

  if (showDesktop) {
    const links = (
      <>
        {SITE_NAV_LINKS.map(({ href, label }) => {
          const active = isSiteNavActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn("transition-colors", active ? ACTIVE : IDLE)}
              aria-current={active ? "page" : undefined}
              onClick={
                onNavigate
                  ? (e) => {
                      e.preventDefault();
                      go(href);
                    }
                  : undefined
              }
            >
              {label}
            </Link>
          );
        })}
      </>
    );

    const desktopClass = cn(
      variant === "layout"
        ? "fixed top-[max(12px,env(safe-area-inset-top))] right-[2%] z-40"
        : "absolute top-[3%] right-[2%] z-10",
      "flex gap-5 font-general-sans text-[10px] uppercase tracking-[0.22em] lg:gap-6",
      className,
    );

    if (variant === "intro") {
      return (
        <motion.nav
          className={desktopClass}
          aria-label="Site"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={navTransition}
        >
          {links}
        </motion.nav>
      );
    }

    return (
      <nav className={desktopClass} aria-label="Site">
        {links}
      </nav>
    );
  }

  const hamburgerClass = cn(
    variant === "layout"
      ? "fixed top-[max(4px,env(safe-area-inset-top))] max-[475px]:right-0.5 right-[2%] sm:right-[3%] z-50"
      : "absolute top-[1%] max-[475px]:right-0.5 right-[2%] sm:right-[3%] z-20",
    "flex h-10 w-10 items-center justify-center",
    className,
  );

  const menu = (
    <AnimatePresence>
      {menuOpen ? (
        <motion.div
          key="mobile-menu"
          className={cn(
            variant === "layout"
              ? "fixed inset-0 z-40"
              : "absolute inset-0 z-15",
            "flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm",
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          onClick={() => setMenuOpen(false)}
        >
          <motion.nav
            className="flex flex-col items-center gap-8 font-general-sans text-[13px] uppercase tracking-[0.28em]"
            aria-label="Site"
            initial="closed"
            animate="open"
            exit="closed"
            variants={{
              open: {
                transition: { staggerChildren: 0.07, delayChildren: 0.08 },
              },
              closed: {
                transition: { staggerChildren: 0.04, staggerDirection: -1 },
              },
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {SITE_NAV_LINKS.map(({ href, label }) => {
              const active = isSiteNavActive(pathname, href);
              return (
                <motion.div
                  key={href}
                  variants={{
                    open: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.4, ease: EASE },
                    },
                    closed: {
                      opacity: 0,
                      y: 12,
                      transition: { duration: 0.25 },
                    },
                  }}
                >
                  <Link
                    href={href}
                    className={cn(
                      "block py-1 transition-colors",
                      active ? ACTIVE : IDLE,
                    )}
                    aria-current={active ? "page" : undefined}
                    onClick={
                      onNavigate
                        ? (e) => {
                            e.preventDefault();
                            go(href);
                          }
                        : () => setMenuOpen(false)
                    }
                  >
                    {label}
                  </Link>
                </motion.div>
              );
            })}
          </motion.nav>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  if (variant === "intro") {
    return (
      <>
        <motion.button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          className={hamburgerClass}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={navTransition}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <HamburgerIcon open={menuOpen} />
        </motion.button>
        {menu}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        className={hamburgerClass}
        onClick={() => setMenuOpen((o) => !o)}
      >
        <HamburgerIcon open={menuOpen} />
      </button>
      {menu}
    </>
  );
}

export default SiteNav;
