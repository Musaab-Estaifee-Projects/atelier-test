import { countriesData } from "@/constants/countries-data";

export type PhoneCountry = (typeof countriesData)[number];

const BY_CODE = new Map(
  countriesData.map((country) => [country.code.toUpperCase(), country]),
);

const GEO_CACHE_KEY = "atelier:phone-cc";

export function getPhoneCountry(
  code?: string | null,
): PhoneCountry | undefined {
  if (!code) return undefined;
  return BY_CODE.get(code.toUpperCase());
}

export function defaultPhoneCountry(): PhoneCountry {
  const ae = getPhoneCountry("AE");
  if (ae) return ae;
  const first = countriesData[0];
  if (!first) throw new Error("countriesData is empty");
  return first;
}

export function countryMask(country: PhoneCountry): string {
  return country.dial_format ?? "";
}

export function maskDigitCount(mask?: string | null): number {
  return (mask?.match(/\d/g) ?? []).length;
}

export function splitMasked(
  digits: string,
  mask?: string | null,
): { filled: string; ghost: string } {
  if (!mask) return { filled: digits, ghost: "" };
  let used = 0;
  let filled = "";
  for (let i = 0; i < mask.length; i += 1) {
    const ch = mask[i];
    if (/\d/.test(ch)) {
      if (used >= digits.length) {
        return { filled, ghost: mask.slice(i) };
      }
      filled += digits[used];
      used += 1;
    } else if (used >= digits.length) {
      return { filled, ghost: mask.slice(i) };
    } else {
      filled += ch;
    }
  }
  return { filled, ghost: "" };
}

export function nationalDigitsFromInput(
  value: string,
  maxDigits: number,
): string {
  return value.replace(/\D/g, "").slice(0, Math.max(0, maxDigits));
}

export function toE164FromParts(
  dialCode: string,
  nationalDigits: string,
): string {
  const code = dialCode.startsWith("+") ? dialCode : `+${dialCode}`;
  return `${code}${nationalDigits}`;
}

export function nationalDigitsFromE164(
  value: string,
  country: PhoneCountry,
): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const digits = trimmed.replace(/\D/g, "");
  const codeDigits = country.dial_code.replace(/\D/g, "");
  if (codeDigits && digits.startsWith(codeDigits)) {
    return digits.slice(codeDigits.length);
  }
  return digits;
}

function countriesByDialLength(): PhoneCountry[] {
  return [...countriesData].sort(
    (a, b) => b.dial_code.length - a.dial_code.length,
  );
}

export function matchPhoneCountry(e164: string): PhoneCountry | undefined {
  const trimmed = e164.trim();
  if (!trimmed.startsWith("+")) return undefined;
  return countriesByDialLength().find((country) =>
    trimmed.startsWith(country.dial_code),
  );
}

function matchingDialCountries(e164: string): PhoneCountry[] {
  const trimmed = e164.trim();
  if (!trimmed.startsWith("+")) return [];
  const matches = countriesData.filter((country) =>
    trimmed.startsWith(country.dial_code),
  );
  if (matches.length === 0) return [];
  const maxLen = Math.max(...matches.map((country) => country.dial_code.length));
  return matches.filter((country) => country.dial_code.length === maxLen);
}

export function acceptedNationalLengths(country: PhoneCountry): number[] {
  const mask = countryMask(country);
  const expected = maskDigitCount(mask);
  if (expected <= 0) return [];
  const lengths = new Set<number>([expected]);
  const maskDigits = mask.replace(/\D/g, "");
  // Local masks often include a trunk 0 that is dropped after the country code.
  if (maskDigits.startsWith("0") && expected > 1) {
    lengths.add(expected - 1);
  }
  return [...lengths];
}

function nationalLengthMatches(
  national: string,
  country: PhoneCountry,
): boolean {
  const accepted = acceptedNationalLengths(country);
  if (accepted.length === 0) {
    return national.length >= 6 && national.length <= 15;
  }
  return accepted.includes(national.length);
}

export function maxNationalDigits(country: PhoneCountry): number {
  const accepted = acceptedNationalLengths(country);
  if (accepted.length === 0) return 15;
  return Math.max(...accepted);
}

export function isPhoneMatchingFormat(
  value: string,
  countryCode?: string | null,
): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;

  const hinted = getPhoneCountry(countryCode);
  const candidates = hinted
    ? [hinted]
    : matchingDialCountries(trimmed);

  if (candidates.length === 0) {
    const digits = trimmed.replace(/\D/g, "");
    return digits.length >= 8 && digits.length <= 15;
  }

  return candidates.some((country) =>
    nationalLengthMatches(nationalDigitsFromE164(trimmed, country), country),
  );
}

export function parseIncomingPhone(
  raw: string,
  fallback: PhoneCountry,
): { country: PhoneCountry; digits: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { country: fallback, digits: "" };

  let e164 = trimmed;
  if (trimmed.startsWith("00")) {
    e164 = `+${trimmed.slice(2)}`;
  }

  const matched =
    e164.startsWith("+") || e164.replace(/\D/g, "").length > 11
      ? matchPhoneCountry(e164.startsWith("+") ? e164 : `+${e164.replace(/\D/g, "")}`)
      : undefined;

  const country = matched ?? fallback;
  const source = e164.startsWith("+")
    ? e164
    : matched
      ? `+${e164.replace(/\D/g, "")}`
      : trimmed;
  const digits = nationalDigitsFromE164(source, country);
  return {
    country,
    digits: digits.slice(0, maxNationalDigits(country)),
  };
}

async function readJsonCountry(
  url: string,
  pick: (data: Record<string, unknown>) => string | undefined,
): Promise<string | undefined> {
  const response = await fetch(url);
  if (!response.ok) return undefined;
  const data = (await response.json()) as Record<string, unknown>;
  const code = pick(data)?.toUpperCase();
  return code && /^[A-Z]{2}$/.test(code) ? code : undefined;
}

export async function detectPhoneCountryCode(): Promise<string | undefined> {
  if (typeof window !== "undefined") {
    try {
      const cached = sessionStorage.getItem(GEO_CACHE_KEY);
      if (cached && /^[A-Z]{2}$/.test(cached)) return cached;
    } catch {
      /* ignore */
    }
  }

  const lookups: Promise<string | undefined>[] = [
    readJsonCountry(
      "https://ipapi.co/json/",
      (data) =>
        (typeof data.country_code === "string" && data.country_code) ||
        undefined,
    ),
    readJsonCountry("https://ipwho.is/", (data) =>
      data.success === false
        ? undefined
        : typeof data.country_code === "string"
          ? data.country_code
          : undefined,
    ),
    fetch("https://www.cloudflare.com/cdn-cgi/trace")
      .then(async (response) => {
        if (!response.ok) return undefined;
        const text = await response.text();
        return text.match(/loc=([A-Z]{2})/)?.[1];
      })
      .catch(() => undefined),
  ];

  const results = await Promise.allSettled(lookups);
  const code = results
    .map((result) =>
      result.status === "fulfilled" ? result.value : undefined,
    )
    .find((value): value is string => Boolean(value));

  if (code && typeof window !== "undefined") {
    try {
      sessionStorage.setItem(GEO_CACHE_KEY, code);
    } catch {
      /* ignore */
    }
  }

  return code;
}
