"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSetAtom } from "jotai";
import PageLoader from "./page-loader";
import ColumnTransition from "./column-transition";
import { pageTransitionDoneAtom } from "@/atoms/transition-atom";

function shouldSkipPageLoader(pathname: string | null | undefined) {
  if (!pathname) return false;
  return pathname === "/" || pathname.startsWith("/configurator");
}

function normalizePath(href: string) {
  try {
    const url = new URL(href, "http://local.invalid");
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return href;
  }
}

const COLUMN_PUSH_MS = 1200;
const COLUMN_EXIT_START_MS = 400;
const COLUMN_HIDE_MS = 900;
const LOGO_ENTER_MS = 700;

const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();

  const setTransitionDone = useSetAtom(pageTransitionDoneAtom);

  const [showLoader, setShowLoader] = useState(
    () => !shouldSkipPageLoader(pathname),
  );
  const [showColumn, setShowColumn] = useState(false);
  const [logoPhase, setLogoPhase] = useState<"idle" | "enter" | "exit">("idle");

  const pendingUrl = useRef<string | null>(null);
  const isTransitioning = useRef(false);
  const isFirstLoad = useRef(true);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const markTransitionDone = useCallback(() => {
    schedule(() => setTransitionDone(true), 0);
  }, [schedule, setTransitionDone]);

  // Stable callback – prevents PageLoader from re-running its effect
  const handleLoaderComplete = useCallback(() => {
    setShowLoader(false);
    markTransitionDone();
  }, [markTransitionDone]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const link = target.closest<HTMLAnchorElement>("a[href]");
      const transitionBtn = target.closest<HTMLElement>("[data-transition-href]");

      if (!link && !transitionBtn) return;

      const rawHref = link
        ? link.getAttribute("href")
        : transitionBtn?.getAttribute("data-transition-href");

      if (!rawHref) return;

      if (
        !rawHref.startsWith("/") ||
        rawHref.startsWith("//") ||
        rawHref.startsWith("/#") ||
        (link &&
          (link.hasAttribute("download") ||
            link.target === "_blank" ||
            link.dataset.noTransition !== undefined))
      ) {
        return;
      }

      const href = normalizePath(rawHref);
      const current = normalizePath(pathname ?? "");
      if (href === current) return;

      if (isTransitioning.current) {
        e.preventDefault();
        return;
      }

      e.preventDefault();

      isTransitioning.current = true;
      pendingUrl.current = href;

      setTransitionDone(false);
      setShowColumn(true);
      setLogoPhase("idle");

      schedule(() => setLogoPhase("enter"), LOGO_ENTER_MS);

      schedule(() => {
        if (pendingUrl.current) {
          router.push(pendingUrl.current);
          pendingUrl.current = null;
        }
      }, COLUMN_PUSH_MS);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname, router, schedule, setTransitionDone]);

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      // Initial showLoader already matches shouldSkipPageLoader(pathname).
      if (shouldSkipPageLoader(pathname)) {
        markTransitionDone();
      }
      return;
    }

    isTransitioning.current = false;

    schedule(() => setLogoPhase("exit"), COLUMN_EXIT_START_MS);

    schedule(() => {
      setShowColumn(false);
      setLogoPhase("idle");
      markTransitionDone();
    }, COLUMN_HIDE_MS);
  }, [pathname, markTransitionDone, schedule]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  return (
    <>
      {children}

      <PageLoader active={showLoader} onComplete={handleLoaderComplete} />

      <ColumnTransition active={showColumn} logoPhase={logoPhase} />
    </>
  );
};

export default PageTransition;
