"use client";

import { useSyncExternalStore } from "react";
import {
  getUeLogEntries,
  getUeLogServerSnapshot,
  subscribeUeLog,
  type UeLogEntry,
} from "@/lib/stream-pixel/ue-logger";

export function useUeLog(): UeLogEntry[] {
  return useSyncExternalStore(
    subscribeUeLog,
    getUeLogEntries,
    getUeLogServerSnapshot,
  );
}
