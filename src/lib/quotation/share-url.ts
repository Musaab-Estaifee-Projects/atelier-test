export function quotationSharePath(designCode?: string | null) {
  const code = designCode?.trim() ?? "";
  return code ? `/quotation/${encodeURIComponent(code)}` : "/quotation";
}

export function quotationShareUrl(designCode?: string | null, origin?: string) {
  const path = quotationSharePath(designCode);
  const base =
    origin?.replace(/\/$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "");
  return base ? `${base}${path}` : path;
}
