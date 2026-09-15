import { CONTACT_STORAGE_KEY, JOURNEY_STORAGE_KEY } from "@/constants/const";
import { normalizeRoleId, toE164Phone } from "@/utils/utils";
import type { ContactInfo } from "@/types/types";

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

function writeContactFromCustomer(customer: StoredCustomer): ContactInfo {
  const info: ContactInfo = {
    name: customer.full_name,
    email: customer.email,
    phone: toE164Phone(customer.phone),
    role: normalizeRoleId(customer.customer_type),
  };
  if (typeof window === "undefined") return info;
  try {
    window.localStorage.setItem(
      CONTACT_STORAGE_KEY,
      JSON.stringify({
        name: info.name,
        email: info.email,
        phone: info.phone,
        role: info.role,
        full_name: customer.full_name,
        customer_type: customer.customer_type,
      }),
    );
  } catch {
    /* quota / private mode */
  }
  return info;
}

/** Persist add-customer API payload into atelier:contact and atelier:journey. */
export function persistCustomerSession(data: {
  journey_token: string;
  expires_at: string;
  customer: StoredCustomer;
}): ContactInfo {
  const customer: StoredCustomer = {
    full_name: data.customer.full_name,
    email: data.customer.email,
    phone: data.customer.phone,
    customer_type: data.customer.customer_type,
  };
  writeJourney({
    token: data.journey_token,
    expiresAt: data.expires_at,
    customer,
  });
  return writeContactFromCustomer(customer);
}
