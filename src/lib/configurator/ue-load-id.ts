/**
 * Bridge between UE SaveCustomization responses and localStorage.
 */

type Waiter = (id: string | null) => void;

let lastLoadId: string | null = null;
const waiters: Waiter[] = [];

export function beginAwaitingUeLoadId(): void {
  lastLoadId = null;
}

export function noteUeLoadId(id: string | null | undefined): void {
  if (!id?.trim()) return;
  lastLoadId = id.trim();
  const pending = waiters.splice(0, waiters.length);
  pending.forEach((fn) => fn(lastLoadId));
}

export function getLastUeLoadId(): string | null {
  return lastLoadId;
}

export function waitForUeLoadId(ms: number): Promise<string | null> {
  if (lastLoadId) return Promise.resolve(lastLoadId);
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      const i = waiters.indexOf(onId);
      if (i >= 0) waiters.splice(i, 1);
      resolve(lastLoadId);
    }, ms);
    const onId: Waiter = (id) => {
      window.clearTimeout(timer);
      resolve(id);
    };
    waiters.push(onId);
  });
}
