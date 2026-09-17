/** Q-XXXX-XXXXX..... */
export const QUOTATION_DESIGN_CODE_PATTERN = /^Q-\d{4}-\d{5,}$/;

export function normalizeQuotationDesignCode(raw: string): string {
  return raw.trim().replace(/\s+/g, "").toUpperCase();
}

export function isQuotationDesignCode(raw: string): boolean {
  return QUOTATION_DESIGN_CODE_PATTERN.test(normalizeQuotationDesignCode(raw));
}
