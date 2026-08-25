"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CATALOG_UNITS,
  LAYOUTS,
  RESIDENCE_TYPES,
  findUnit,
  isDesignCode,
  layoutsForType,
  normalizeDesignCode,
  searchUnits,
} from "@/lib/projects/apartments";

export type ApartmentChoice = {
  unitId: string;
  levelName: string;
  designCode?: string;
};

type Props = {
  title?: string;
  titleId?: string;
  pending?: boolean;
  error?: string | null;
  autoFocus?: boolean;
  onSubmit: (choice: ApartmentChoice) => void;
};

type MenuId = "search" | "type" | "layout" | null;

function OptionList({
  options,
  value,
  labelledBy,
  onSelect,
}: {
  options: { id: string; label: string }[];
  value?: string;
  labelledBy?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <ul
      role="listbox"
      aria-labelledby={labelledBy}
      className="absolute top-full left-0 z-30 mt-1 flex w-full flex-col gap-[5px] bg-[#00272d] p-[5px] shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
    >
      {options.map((option) => (
        <li key={option.id}>
          <button
            type="button"
            role="option"
            aria-selected={option.id === value}
            className={`w-full px-2.5 py-2.5 text-left text-[12px] leading-[1.2] text-white/70 transition-colors hover:bg-white/5 ${
              option.id === value ? "bg-white/5 text-white" : ""
            }`}
            onClick={() => onSelect(option.id)}
          >
            {option.label}
          </button>
        </li>
      ))}
    </ul>
  );
}

function DashedDropdown({
  label,
  value,
  placeholder,
  options,
  open,
  onToggle,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: { id: string; label: string }[];
  open: boolean;
  onToggle: () => void;
  onChange: (id: string) => void;
}) {
  const labelId = useId();
  const selected = options.find((option) => option.id === value);

  return (
    <div className="relative min-w-0 flex-1">
      <button
        type="button"
        id={labelId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={onToggle}
        className="flex w-full items-center gap-2 border-b border-dashed border-white/35 py-3.5 text-left"
      >
        <span
          className={`min-w-0 flex-1 truncate text-[12px] leading-[1.2] ${
            selected ? "text-white/80" : "text-white/28"
          }`}
        >
          {selected?.label ?? placeholder}
        </span>
        <span className="relative block h-[6.25px] w-2.5 shrink-0 overflow-clip">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/projects/chevron.svg"
            alt=""
            className={`h-full w-full transition-transform ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>
      {open ? (
        <OptionList
          options={options}
          value={value}
          labelledBy={labelId}
          onSelect={onChange}
        />
      ) : null}
    </div>
  );
}

export default function ApartmentForm({
  title = "Select Apartment",
  titleId,
  pending = false,
  error,
  autoFocus = false,
  onSubmit,
}: Props) {
  const generatedTitleId = useId();
  const headingId = titleId ?? generatedTitleId;
  const rootRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [typeId, setTypeId] = useState("");
  const [layoutId, setLayoutId] = useState("");
  const [openMenu, setOpenMenu] = useState<MenuId>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const layouts = useMemo(
    () => (typeId ? layoutsForType(typeId) : LAYOUTS),
    [typeId],
  );

  const suggestions = useMemo(() => searchUnits(query), [query]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (!openMenu) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu(null);
    };
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [openMenu]);

  const submitChoice = (choice: ApartmentChoice) => {
    setLocalError(null);
    setOpenMenu(null);
    onSubmit(choice);
  };

  const resolveFromFilters = (): ApartmentChoice | null => {
    const layout = LAYOUTS.find((item) => item.id === layoutId);
    if (layout && (!typeId || layout.typeId === typeId)) {
      return { unitId: layout.unitId, levelName: layout.levelName };
    }
    if (typeId && !layoutId) {
      const fallback = layoutsForType(typeId)[0];
      if (fallback) {
        return { unitId: fallback.unitId, levelName: fallback.levelName };
      }
    }
    return null;
  };

  const handleType = (id: string) => {
    setTypeId(id);
    setLayoutId("");
    setLocalError(null);
    setOpenMenu(null);
  };

  const handleSuggestion = (unitId: string) => {
    const unit = CATALOG_UNITS.find((item) => item.id === unitId);
    if (!unit) return;
    setQuery(unit.id);
    setTypeId(unit.typeId);
    setLayoutId(unit.layoutId);
    submitChoice({ unitId: unit.unitId, levelName: unit.levelName });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();

    if (trimmed && isDesignCode(trimmed)) {
      submitChoice({
        unitId: "",
        levelName: "",
        designCode: normalizeDesignCode(trimmed),
      });
      return;
    }

    const unit = trimmed ? findUnit(trimmed) : undefined;
    if (unit) {
      submitChoice({ unitId: unit.unitId, levelName: unit.levelName });
      return;
    }

    const fromFilters = resolveFromFilters();
    if (fromFilters) {
      submitChoice(fromFilters);
      return;
    }

    setLocalError(
      trimmed
        ? "We couldn’t find that unit. Try a unit number or choose type and layout."
        : "Search for a unit number, or select residence type and layout.",
    );
  };

  return (
    <form
      ref={rootRef}
      onSubmit={handleSubmit}
      className="flex w-full max-w-[466px] flex-col items-stretch gap-9"
    >
      <h1
        id={headingId}
        className="text-center font-libre-baskerville text-[clamp(22px,6vw,27.4px)] leading-[1.16] font-normal tracking-[0.05em] text-white uppercase"
      >
        {title}
      </h1>

      <div className="flex flex-col gap-6">
        <div className="relative">
          <label className="flex w-full items-center gap-2 border-b border-dashed border-white/35 py-3.5">
            <span className="sr-only">Search for unit number</span>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setLocalError(null);
                setOpenMenu("search");
              }}
              onFocus={() => {
                if (query.trim()) setOpenMenu("search");
              }}
              placeholder="Search for unit number"
              autoComplete="off"
              spellCheck={false}
              disabled={pending}
              className="min-w-0 flex-1 bg-transparent text-[12px] leading-[1.2] text-white outline-none placeholder:text-white/28"
            />
            <span className="relative block size-[18px] shrink-0 overflow-clip">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/projects/search.svg"
                alt=""
                className="h-full w-full"
              />
            </span>
          </label>
          {openMenu === "search" && suggestions.length > 0 ? (
            <OptionList
              options={suggestions.map((unit) => ({
                id: unit.id,
                label: unit.label,
              }))}
              onSelect={handleSuggestion}
            />
          ) : null}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="h-px min-w-0 flex-1 bg-white/10" />
          <span className="text-[12px] tracking-[0.04em] text-white">OR</span>
          <span className="h-px min-w-0 flex-1 bg-white/10" />
        </div>

        <div className="flex items-center gap-5">
          <DashedDropdown
            label="Residence type"
            value={typeId}
            placeholder="Select Residence Type"
            options={RESIDENCE_TYPES}
            open={openMenu === "type"}
            onToggle={() => setOpenMenu((v) => (v === "type" ? null : "type"))}
            onChange={handleType}
          />
          <DashedDropdown
            label="Layout"
            value={layoutId}
            placeholder="Select Layout"
            options={layouts.map((layout) => ({
              id: layout.id,
              label: typeId
                ? layout.label
                : `${RESIDENCE_TYPES.find((type) => type.id === layout.typeId)?.label ?? ""} · ${layout.label}`,
            }))}
            open={openMenu === "layout"}
            onToggle={() =>
              setOpenMenu((v) => (v === "layout" ? null : "layout"))
            }
            onChange={(id) => {
              const layout = LAYOUTS.find((item) => item.id === id);
              setLayoutId(id);
              if (layout) setTypeId(layout.typeId);
              setLocalError(null);
              setOpenMenu(null);
            }}
          />
        </div>

        {(localError || error) && (
          <p role="alert" className="text-[12px] leading-[1.4] text-[#e29584]">
            {localError || error}
          </p>
        )}

        <Button
          type="submit"
          variant="pill"
          size="pill"
          className="w-full text-[12px] text-white"
          disabled={pending}
        >
          {pending ? "Checking…" : "Continue"}
        </Button>
      </div>
    </form>
  );
}
