// src/app/configurator/layout.tsx
"use client";

import { useEffect } from "react";
import "./configurator.css";

/**
 * Lock the document to a fixed viewport for the stream page.
 * Global Lenis sets `html.lenis body { height: auto }` which breaks %/fill layouts.
 */
export default function ConfiguratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.classList.add("configurator-active");
    body.classList.add("configurator-active");

    return () => {
      html.classList.remove("configurator-active");
      body.classList.remove("configurator-active");
    };
  }, []);

  return children;
}
