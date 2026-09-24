"use client";

import { Provider } from "jotai";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const isDev = process.env.NODE_ENV === "development";

/** Dev-only: keeps jotai-devtools (and its ~1 MB CSS) out of production bundles. */
const JotaiDevTools = isDev
  ? dynamic(() => import("./jotai-devtools"), { ssr: false })
  : () => null;

export const JotaiProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const showDevtools = isDev && !pathname?.startsWith("/configurator");

  return (
    <Provider>
      {showDevtools ? <JotaiDevTools /> : null}
      {children}
    </Provider>
  );
};
