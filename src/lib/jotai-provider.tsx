"use client";

import { Provider } from "jotai";
import { DevTools } from "jotai-devtools";
import "jotai-devtools/styles.css";
import type { ReactNode } from "react";

export const JotaiProvider = ({ children }: { children: ReactNode }) => {
  return (
    <Provider>
      {process.env.NODE_ENV === "development" && (
        <DevTools position="bottom-right" />
      )}
      {children}
    </Provider>
  );
};
