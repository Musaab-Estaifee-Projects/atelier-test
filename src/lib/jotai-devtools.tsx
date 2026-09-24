"use client";

import { DevTools } from "jotai-devtools";
import "jotai-devtools/styles.css";

export default function JotaiDevTools() {
  return <DevTools position="bottom-right" />;
}
