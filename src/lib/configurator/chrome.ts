export function catalogImageUrl(src?: string | null): string | null {
  if (typeof src !== "string") return null;
  const value = src.trim();
  if (!value || value === "null" || value === "undefined") return null;
  return value;
}
