/** Q-XXXX-XXXXX..... */
export const QUOTATION_DESIGN_CODE_PATTERN = /^Q-\d{4}-\d{5,}$/;

export function normalizeQuotationDesignCode(raw: string): string {
  return raw.trim().replace(/\s+/g, "").toUpperCase();
}

/** Route slug → normalized code; malformed percent-encoding yields "". */
export function quotationCodeFromSlug(slug: string): string {
  try {
    return normalizeQuotationDesignCode(decodeURIComponent(slug));
  } catch {
    return "";
  }
}

export function isQuotationDesignCode(raw: string): boolean {
  return QUOTATION_DESIGN_CODE_PATTERN.test(normalizeQuotationDesignCode(raw));
}
