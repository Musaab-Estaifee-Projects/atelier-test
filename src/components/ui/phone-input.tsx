"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import CustomChevron from "@/components/icons/custom-chevron";
import { countriesData } from "@/constants/countries-data";
import {
  countryMask,
  defaultPhoneCountry,
  detectPhoneCountryCode,
  getPhoneCountry,
  matchPhoneCountry,
  maxNationalDigits,
  nationalDigitsFromE164,
  nationalDigitsFromInput,
  parseIncomingPhone,
  splitMasked,
  toE164FromParts,
  type PhoneCountry,
} from "@/lib/phone";
import { cn } from "@/lib/utils";

type PhoneInputVariant = "default" | "atelier";

function CountryFlag({ code }: { code: string }) {
  return (
    <img
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      alt=""
      width={18}
      height={12}
      draggable={false}
      className="h-3 w-4.5 shrink-0 object-cover"
    />
  );
}

type Props = {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  variant?: PhoneInputVariant;
  className?: string;
  name?: string;
  id?: string;
};

const PhoneInput = ({
  value = "",
  onChange,
  onBlur,
  disabled = false,
  variant = "default",
  className,
  name,
  id,
}: Props) => {
  const atelier = variant === "atelier";
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const touchedRef = useRef(false);
  const valueRef = useRef(value);
  // eslint-disable-next-line react-hooks/refs
  valueRef.current = value;
  const [country, setCountry] = useState<PhoneCountry>(defaultPhoneCountry);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuBox, setMenuBox] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const mask = countryMask(country);
  const maxDigits = maxNationalDigits(country);
  const digits = nationalDigitsFromE164(value, country);
  const { filled, ghost } = splitMasked(digits, mask);
  const placeholder = ghost || (!filled ? mask || "Phone number" : "");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countriesData;
    return countriesData.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.dial_code.includes(q.replace(/\s/g, "")),
    );
  }, [query]);

  const emit = useCallback(
    (nextCountry: PhoneCountry, nextDigits: string) => {
      onChange?.(
        nextDigits ? toE164FromParts(nextCountry.dial_code, nextDigits) : "",
      );
    },
    [onChange],
  );

  useEffect(() => {
    if (touchedRef.current) return;
    const matched = matchPhoneCountry(value);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (matched) setCountry(matched);
  }, [value]);

  useEffect(() => {
    let cancelled = false;
    const detect = async () => {
      const code = await detectPhoneCountryCode();
      if (cancelled || touchedRef.current || valueRef.current.trim()) return;
      const next = getPhoneCountry(code);
      if (next) setCountry(next);
    };
    void detect();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectCountry = (next: PhoneCountry) => {
    touchedRef.current = true;
    setCountry(next);
    setOpen(false);
    setQuery("");
    emit(next, digits.slice(0, maxNationalDigits(next)));
  };

  const handleDigits = (raw: string) => {
    touchedRef.current = true;
    const looksInternational =
      raw.trim().startsWith("+") ||
      raw.trim().startsWith("00") ||
      raw.replace(/\D/g, "").length > maxDigits;
    if (looksInternational) {
      const parsed = parseIncomingPhone(raw, country);
      setCountry(parsed.country);
      emit(parsed.country, parsed.digits);
      return;
    }
    emit(country, nationalDigitsFromInput(raw, maxDigits));
  };

  const updateMenuBox = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuBox({
      top: rect.bottom + 4,
      left: rect.left,
      width: 248,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updateMenuBox();
    const onWin = () => updateMenuBox();
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      const menu = document.getElementById(listId);
      if (menu?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("resize", onWin);
    window.addEventListener("scroll", onWin, true);
    window.addEventListener("keydown", onKey);
    const listenTimer = window.setTimeout(() => {
      window.addEventListener("pointerdown", onPointer);
    }, 0);
    return () => {
      window.clearTimeout(listenTimer);
      window.removeEventListener("resize", onWin);
      window.removeEventListener("scroll", onWin, true);
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, listId, updateMenuBox]);

  const menu =
    open && menuBox && typeof document !== "undefined"
      ? createPortal(
          <div
            id={listId}
            role="listbox"
            style={{
              top: menuBox.top,
              left: menuBox.left,
              width: menuBox.width,
            }}
            className="fixed z-120 flex max-h-52! flex-col gap-1.25 bg-[#00272d] p-1.25 shadow-[0_16px_40px_rgba(0,0,0,0.35)] max-w-70"
          >
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search country"
              autoComplete="off"
              className="w-full border-b border-dashed border-white/20 bg-transparent px-2.5 py-2 text-[12px] leading-[1.2] text-white outline-none placeholder:text-white/28"
            />
            <ul
              data-lenis-prevent
              className="flex min-h-0 flex-1 flex-col overflow-y-auto hidden-scrollbar"
            >
              {filtered.length === 0 ? (
                <li className="px-2.5 py-2.5 text-[12px] leading-[1.2] text-white/50">
                  No country found
                </li>
              ) : (
                filtered.map((item) => (
                  <li key={item.code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={item.code === country.code}
                      className={cn(
                        "flex w-full items-center gap-2 px-2.5 py-2.5 text-left text-[12px] leading-[1.2] text-white/70 transition-colors hover:bg-white/5",
                        item.code === country.code && "bg-white/5 text-white",
                      )}
                      onClick={() => selectCountry(item)}
                    >
                      <CountryFlag code={item.code} />
                      <span className="min-w-0 flex-1 truncate">
                        {item.name}
                      </span>
                      <span className="shrink-0 text-white/40">
                        {item.dial_code}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      ref={rootRef}
      className={cn(
        "flex w-full items-center gap-2",
        atelier ? "" : "border-b border-black pb-2",
        className,
      )}
    >
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select country"
        onClick={(event) => {
          event.stopPropagation();
          if (disabled) return;
          setOpen((v) => !v);
        }}
        className={cn(
          "flex shrink-0 items-center gap-1.5",
          disabled && "cursor-not-allowed opacity-40",
        )}
      >
        <CountryFlag code={country.code} />
        <span className="relative block h-[6.25px] w-2.5 overflow-clip">
          <CustomChevron
            className={cn(
              "h-full w-full transition-transform",
              open && "rotate-180",
            )}
          />
        </span>
      </button>

      <span
        className={cn(
          "shrink-0 text-[12px] leading-[1.2]",
          atelier ? "text-white/50" : "text-black/50",
        )}
      >
        {country.dial_code}
      </span>

      <label className="relative min-w-0 flex-1">
        <span className="sr-only">Phone number</span>
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 flex items-center overflow-hidden text-[12px] leading-[1.2]",
            atelier ? "text-white/28" : "text-black/30",
          )}
        >
          <span className="invisible whitespace-pre">{filled}</span>
          <span className="whitespace-pre">{placeholder}</span>
        </span>
        <input
          id={id}
          name={name}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          spellCheck={false}
          disabled={disabled}
          value={filled}
          placeholder=""
          onBlur={onBlur}
          onChange={(event) => handleDigits(event.target.value)}
          className={cn(
            "relative w-full bg-transparent text-[12px] leading-[1.2] outline-none",
            atelier ? "text-white caret-white" : "text-black",
          )}
        />
      </label>
      {menu}
    </div>
  );
};

export { PhoneInput };
