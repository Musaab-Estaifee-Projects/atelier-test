/** Real zone only — empty / whitespace never belong in the URL. */
export function normalizeZone(zone: string | null | undefined): string | null {
  if (zone == null) return null;
  const trimmed = String(zone).trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Configurator path + query with `renders` removed (hard reload onto a fresh sheet). */
export function locationWithoutRenders(): string {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href);
  url.searchParams.delete("renders");
  return `${url.pathname}${url.search}${url.hash}`;
}
