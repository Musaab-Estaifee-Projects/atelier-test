"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Blocks tab close and browser back while configuring. `watchKey` changes
 * whenever the configurator URL changes so "Stay" restores the latest URL.
 */
export function useLeaveGuard(watchKey: string) {
  const router = useRouter();
  const allowUnloadRef = useRef(false);
  const skipPopGuardRef = useRef(false);
  const pendingLeaveRef = useRef<string | null>(null);
  const stayHrefRef = useRef("");
  const [leaveOpen, setLeaveOpen] = useState(false);

  /** Call before an intentional in-app navigation away from the configurator. */
  const allowNavigation = useCallback(() => {
    allowUnloadRef.current = true;
    skipPopGuardRef.current = true;
  }, []);

  /** Call before an intentional full reload of the configurator. */
  const allowReload = useCallback(() => {
    allowUnloadRef.current = true;
  }, []);

  const requestLeave = useCallback((target: string) => {
    pendingLeaveRef.current = target;
    setLeaveOpen(true);
  }, []);

  const stay = useCallback(() => {
    pendingLeaveRef.current = null;
    setLeaveOpen(false);
  }, []);

  const confirmLeave = useCallback(() => {
    const target = pendingLeaveRef.current;
    allowUnloadRef.current = true;
    skipPopGuardRef.current = true;
    setLeaveOpen(false);
    if (target) window.location.assign(target);
  }, []);

  useEffect(() => {
    if (leaveOpen) return;
    stayHrefRef.current = window.location.href;
  }, [leaveOpen, watchKey]);

  useEffect(() => {
    allowUnloadRef.current = false;
    skipPopGuardRef.current = false;
    stayHrefRef.current = window.location.href;

    const restoreStayHref = () => {
      const stayHref = stayHrefRef.current;
      if (!stayHref) return;
      window.history.pushState({ atelierLeaveGuard: true }, "", stayHref);
      try {
        const url = new URL(stayHref, window.location.origin);
        router.replace(`${url.pathname}${url.search}`, { scroll: false });
      } catch {
        /* keep pushState restore */
      }
    };

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (allowUnloadRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    const onPopState = () => {
      if (skipPopGuardRef.current || allowUnloadRef.current) return;
      const popped = window.location.href;
      const stayHref = stayHrefRef.current;
      if (!stayHref || popped === stayHref) return;
      restoreStayHref();
      requestLeave(popped);
    };
    window.addEventListener("popstate", onPopState, true);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("popstate", onPopState, true);
    };
  }, [requestLeave, router]);

  return { leaveOpen, stay, confirmLeave, allowNavigation, allowReload };
}
