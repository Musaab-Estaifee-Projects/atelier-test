const STORAGE_PREFIX = "atelier:stream-lock:";

export type StreamLockClaim = "held" | "blocked";

type ActiveHold = {
  name: string;
  release: () => void;
  released: Promise<void>;
};

/** Lock held by this document only. A duplicated tab has a separate copy. */
let activeHold: ActiveHold | null = null;
let ticket = 0;
/** Requests run one after another so a new layout waits until the old lock is gone. */
let chain: Promise<void> = Promise.resolve();

export function streamLockStorageKey(args: {
  streamProjectId: string;
  projectId: string;
  layoutCode: string;
}): string {
  const parts = [args.streamProjectId, args.projectId, args.layoutCode].map(
    (part) => encodeURIComponent(part.trim()),
  );
  return `${STORAGE_PREFIX}${parts.join("|")}`;
}

function waitForTurn(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 0);
  });
}

/**
 * Take `name` only when no other document holds it.
 * `release` ends the callback so the browser drops the lock.
 */
function requestIfAvailable(name: string): Promise<{
  granted: boolean;
  release: () => void;
  released: Promise<void>;
}> {
  let release = () => {};
  let markReleased = () => {};
  const released = new Promise<void>((resolve) => {
    markReleased = resolve;
  });
  let markGrant: (granted: boolean) => void = () => {};
  const grant = new Promise<boolean>((resolve) => {
    markGrant = resolve;
  });
  const once = (granted: boolean) => {
    markGrant(granted);
    markGrant = () => {};
  };

  void navigator.locks
    .request(name, { ifAvailable: true }, async (lock) => {
      once(Boolean(lock));
      if (!lock) return;
      await new Promise<void>((resolve) => {
        release = resolve;
      });
    })
    .catch(() => {
      once(false);
    })
    .finally(markReleased);

  return grant.then((granted) => ({ granted, release, released }));
}

/**
 * One lock for an exact stream, project, and layout.
 * Changing any of those in this tab releases the old lock, then takes the new one.
 * `blocked` means another document already holds this exact combination.
 */
export function holdStreamLock(
  name: string,
  onResult: (result: StreamLockClaim) => void,
): () => void {
  const mine = ++ticket;
  let cancelled = false;
  let releaseGrant = () => {};

  const stop = () => {
    cancelled = true;
    releaseGrant();
    if (activeHold?.name === name) {
      const current = activeHold;
      activeHold = null;
      current.release();
    }
  };

  chain = chain
    .then(async () => {
      if (cancelled || mine !== ticket) return;

      if (typeof navigator === "undefined" || !navigator.locks) {
        onResult("held");
        return;
      }

      if (activeHold) {
        const previous = activeHold;
        activeHold = null;
        previous.release();
        await previous.released;
        await waitForTurn();
      }
      if (cancelled || mine !== ticket) return;

      const attempt = await requestIfAvailable(name);
      if (cancelled || mine !== ticket) {
        if (attempt.granted) {
          attempt.release();
          await attempt.released;
          await waitForTurn();
        }
        return;
      }
      if (!attempt.granted) {
        onResult("blocked");
        return;
      }

      releaseGrant = attempt.release;
      activeHold = {
        name,
        release: attempt.release,
        released: attempt.released,
      };
      onResult("held");
      await attempt.released;
      if (activeHold?.name === name) activeHold = null;
      await waitForTurn();
    })
    .catch(() => {
      /* keep later layout changes able to take a lock */
    });

  return stop;
}
