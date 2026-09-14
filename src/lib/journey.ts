import { JOURNEY_STORAGE_KEY } from "@/constants/const";

export type StoredCustomer = {
  full_name: string;
  email: string;
  phone: string;
  customer_type: string;
};

export type StoredJourney = {
  token: string;
  expiresAt: string;
  customer: StoredCustomer;
};

export function readJourney(): StoredJourney | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(JOURNEY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredJourney;
    if (!parsed?.token || !parsed?.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeJourney(journey: StoredJourney): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify(journey));
  } catch {
    /* quota / private mode */
  }
}

export function clearJourney(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(JOURNEY_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function isJourneyValid(journey: StoredJourney | null): boolean {
  if (!journey?.token) return false;
  const expires = Date.parse(journey.expiresAt);
  if (!Number.isFinite(expires)) return false;
  return expires > Date.now() + 5_000;
}

export function getValidJourneyToken(): string | null {
  const journey = readJourney();
  if (!isJourneyValid(journey) || !journey) return null;
  return journey.token;
}
