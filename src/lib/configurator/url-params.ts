/** URL helpers for configurator share params. */

/** Real zone only — empty / whitespace never belong in the URL. */
export function normalizeZone(
  zone: string | null | undefined,
): string | null {
  if (zone == null) return null;
  const trimmed = String(zone).trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Build a setParams patch for zone:
 * - real zone → `{ zone }`
 * - absent → `{}` (do not append / do not invent)
 * Pass `clearIfMissing: true` to explicitly delete a stale zone key.
 */
export function zoneUrlPatch(
  zone: string | null | undefined,
  opts?: { clearIfMissing?: boolean },
): { zone?: string | null } {
  const z = normalizeZone(zone);
  if (z) return { zone: z };
  if (opts?.clearIfMissing) return { zone: null };
  return {};
}
