import { CONTACT_STORAGE_KEY } from "@/constants/const";
import { ContactInfo } from "@/types/types";

export function clearStoredContact(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CONTACT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function readContact(): ContactInfo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONTACT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ContactInfo;
    if (
      typeof parsed?.name === "string" &&
      typeof parsed?.email === "string" &&
      typeof parsed?.phone === "string" &&
      typeof parsed?.role === "string"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
