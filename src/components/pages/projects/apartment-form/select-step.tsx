"use client";

import {
  useId,
  useRef,
  useState,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import { ApartmentChoice } from "../apartment-form";
import { Button } from "@/components/ui/button";
import {
  layoutsForType,
  LAYOUTS,
  searchUnits,
  CATALOG_UNITS,
  isDesignCode,
  normalizeDesignCode,
  findUnit,
  RESIDENCE_TYPES,
} from "@/lib/projects/apartments";
import { Search } from "lucide-react";
import DashedDropdown from "./dashed-dropdown";
import OptionList from "./option-list";
import { MenuId } from "@/types/types";

type Props = {
  title?: string;
  titleId?: string;
  pending: boolean;
  error?: string | null;
  autoFocus: boolean;
  onSubmit: (choice: ApartmentChoice) => void;
};

const SelectStep = ({
  title = "Select Apartment",
  titleId,
  pending,
  error,
  autoFocus,
  onSubmit,
}: Props) => {
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
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
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

  const submitChoice = useCallback(
    (choice: ApartmentChoice) => {
      setLocalError(null);
      setOpenMenu(null);
      onSubmit(choice);
    },
    [onSubmit],
  );

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
      className="flex w-full max-w-116.5 flex-col items-stretch gap-9"
      data-lenis-prevent
    >
      <h1
        id={headingId}
        className="text-center font-libre-baskerville text-[clamp(22px,6vw,27.4px)] font-normal leading-[1.16] tracking-[0.05em] text-[#f2e9d8] capitalize"
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
            <span className="relative block size-4.5 shrink-0 overflow-clip">
              <Search className="h-full w-full" />
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
};

export default SelectStep;
