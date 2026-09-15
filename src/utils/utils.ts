import { CONTACT_STORAGE_KEY, ROLES } from "@/constants/const";
import { ContactInfo, RoleId } from "@/types/types";

const ROLE_IDS = new Set<RoleId>(ROLES.map((role) => role.id));

export function normalizeRoleId(role: string | undefined): RoleId {
  if (role === "considering") return "considering_purchase";
  if (role && ROLE_IDS.has(role as RoleId)) return role as RoleId;
  return "owner";
}

export function toE164Phone(value: string): string {
  return value.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
}

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
    const parsed = JSON.parse(raw) as {
      name?: string;
      full_name?: string;
      email?: string;
      phone?: string;
      role?: string;
      customer_type?: string;
    };
    const name = parsed.name || parsed.full_name;
    const role = parsed.role || parsed.customer_type;
    if (
      typeof name === "string" &&
      typeof parsed.email === "string" &&
      typeof parsed.phone === "string" &&
      typeof role === "string"
    ) {
      return {
        name,
        email: parsed.email,
        phone: toE164Phone(parsed.phone),
        role: normalizeRoleId(role),
      };
    }
    return null;
  } catch {
    return null;
  }
}
