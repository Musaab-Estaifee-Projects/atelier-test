export function isDesignCode(query: string): boolean {
  return /^AT-?[A-Z0-9]{4,}$/i.test(query.trim());
}

export function normalizeDesignCode(query: string): string {
  const raw = query.trim().toUpperCase().replace(/\s+/g, "");
  return raw.startsWith("AT-") ? raw : raw.replace(/^AT/, "AT-");
}
