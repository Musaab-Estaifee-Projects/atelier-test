"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { env } from "@/lib/env";
import {
  holdStreamLock,
  streamLockStorageKey,
} from "@/lib/stream-pixel/tab-lock";

export type StreamTabLockStatus = "off" | "pending" | "held" | "blocked";

type Args = {
  /** Feature flag plus a complete stream, project, and layout. */
  active: boolean;
  streamProjectId: string;
  projectId: string | null;
  layoutCode: string;
};

const RETRY_FEEDBACK_MS = 700;

/**
 * One live tab per stream, project, and layout when the env flag is on.
 * Leaving the configurator releases the lock, so the same tab can open it again.
 * A duplicated Chrome tab is a new document and stays blocked while the first
 * tab is connected. When the flag is off, status stays "off" and no lock is taken.
 */
export function useStreamTabLock({
  active,
  streamProjectId,
  projectId,
  layoutCode,
}: Args): { status: StreamTabLockStatus; checking: boolean; retry: () => void } {
  const flagOn = env.NEXT_PUBLIC_SINGLE_TAB_STREAM;
  const [attempt, setAttempt] = useState(0);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<StreamTabLockStatus>(
    flagOn && active ? "pending" : "off",
  );
  const feedbackTimerRef = useRef<number | null>(null);
  const keyRef = useRef("");
  const statusRef = useRef(status);
  statusRef.current = status;

  const retry = useCallback(() => {
    setChecking(true);
    if (feedbackTimerRef.current != null) {
      window.clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = window.setTimeout(() => {
      feedbackTimerRef.current = null;
      setChecking(false);
    }, RETRY_FEEDBACK_MS);
    setAttempt((current) => current + 1);
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current != null) {
        window.clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!flagOn || !active || !projectId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- flag or key changed; drop any pending claim
      setStatus("off");
      return;
    }

    const name = streamLockStorageKey({
      streamProjectId,
      projectId,
      layoutCode,
    });
    // A new stream, project, or layout must not keep the previous "blocked" result.
    // Retry on the same key stays on the dialog so the button loader can finish.
    if (keyRef.current !== name) {
      keyRef.current = name;
      if (statusRef.current === "blocked" || statusRef.current === "held") {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- URL key changed; wait for the new lock
        setStatus("pending");
      }
    }

    let stopped = false;
    const release = holdStreamLock(name, (result) => {
      if (stopped) return;
      setStatus(result);
    });

    return () => {
      stopped = true;
      release();
    };
  }, [active, attempt, flagOn, layoutCode, projectId, streamProjectId]);

  return { status, checking, retry };
}
