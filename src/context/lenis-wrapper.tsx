"use client";

import { ReactLenis } from "lenis/react";
import type { LenisRef } from "lenis/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const LenisWrapper = () => {
  const lenisRef = useRef<LenisRef>(null);
  const pathname = usePathname();
  const isConfigurator = pathname?.startsWith("/configurator");

  useEffect(() => {
    const lenis = lenisRef.current?.lenis;

    if (isConfigurator) {
      lenis?.stop();
      return;
    }

    lenis?.start();

    const handleBeforeUnload = () => {
      lenis?.stop();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      lenis?.destroy();
    };
  }, [isConfigurator]);

  if (isConfigurator) return null;

  return (
    <ReactLenis
      ref={lenisRef}
      root
      options={{
        // lerp: 0.1,
        lerp: 0.05,
        duration: 1.2,
        smoothWheel: true,
        stopInertiaOnNavigate: true,
        autoRaf: true,
        // !Lenis for Mobile:
        syncTouch: true,
        // syncTouchLerp: 0.08,
        // touchMultiplier: 1.2,
        // touchInertiaMultiplier: 30,
      }}
    />
  );
};

export default LenisWrapper;
