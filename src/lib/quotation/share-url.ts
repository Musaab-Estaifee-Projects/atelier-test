export function quotationPath(designCode?: string | null) {
  const code = designCode?.trim() ?? "";
  return code ? `/quotation/${encodeURIComponent(code)}` : "/quotation";
}

export function quotationKeepPath(designCode: string) {
  return `${quotationPath(designCode)}/keep`;
}

export function quotationShareUrl(designCode?: string | null, origin?: string) {
  const path = quotationPath(designCode);
  const base =
    origin?.replace(/\/$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "");
  return base ? `${base}${path}` : path;
}
