"use client";

import { Provider } from "jotai";
import { DevTools } from "jotai-devtools";
import "jotai-devtools/styles.css";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export const JotaiProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const showDevtools =
    process.env.NODE_ENV === "development" &&
    !pathname?.startsWith("/configurator");

  return (
    <Provider>
      {showDevtools ? <DevTools position="bottom-right" /> : null}
      {children}
    </Provider>
  );
};
