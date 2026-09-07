"use client";

import {
  useId,
  useRef,
  useState,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ApartmentChoice } from "../apartment-form";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import DashedDropdown from "./dashed-dropdown";
import OptionList from "./option-list";
import { MenuId, TProject } from "@/types/types";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import {
  searchApartments,
  TApartmentSearchItem,
} from "@/services/search-apartments.service";
import { isDesignCode, normalizeDesignCode } from "@/lib/projects/apartments";

const schema = z.object({
  query: z.string(),
  categoryId: z.string(),
  typeId: z.string(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  project: TProject;
  title?: string;
  titleId?: string;
  pending: boolean;
  error?: string | null;
  autoFocus: boolean;
  onSubmit: (choice: ApartmentChoice) => void;
};

const DEBOUNCE_MS = 350;

const SelectStep = ({
  project,
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

  const [openMenu, setOpenMenu] = useState<MenuId>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // Search + pagination state
  const [suggestions, setSuggestions] = useState<TApartmentSearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [activeQuery, setActiveQuery] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      query: "",
      categoryId: "",
      typeId: "",
    },
  });

  const query = form.watch("query");
  const categoryId = form.watch("categoryId");
  const typeId = form.watch("typeId");

  // Categories from project
  const categories = useMemo(
    () =>
      project?.categories?.map((cat) => ({
        id: String(cat.id),
        label: cat.name,
      })) ?? [],
    [project.categories],
  );

  const typeOptions = useMemo(() => {
    if (!categoryId) return [];
    const category = project?.categories?.find(
      (c) => String(c.id) === categoryId,
    );
    if (!category) return [];
    return category.types.map((t) => ({
      id: String(t.id),
      label: `${t.name} - ${t.layout_area} sq ft`,
      layoutCode: t.layout_code,
    }));
  }, [categoryId, project.categories]);

  // Debounced first-page search
  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setSuggestions([]);
      setIsSearching(false);
      setIsLoadingMore(false);
      setPage(1);
      setHasMore(false);
      setActiveQuery("");
      return;
    }

    if (isDesignCode(trimmed)) {
      setSuggestions([]);
      setIsSearching(false);
      setIsLoadingMore(false);
      setPage(1);
      setHasMore(false);
      setActiveQuery("");
      return;
    }

    setIsSearching(true);
    setPage(1);
    setHasMore(false);

    const timer = setTimeout(async () => {
      try {
        const res = await searchApartments(project.id, trimmed, 1);
        setSuggestions(res.data);
        setActiveQuery(trimmed);
        setHasMore(res.pagination.current_page < res.pagination.last_page);
        setPage(1);
      } catch {
        setSuggestions([]);
        setHasMore(false);
        setActiveQuery("");
      } finally {
        setIsSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, project.id]);

  const loadMore = useCallback(async () => {
    if (!activeQuery || isLoadingMore || isSearching || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      const res = await searchApartments(project.id, activeQuery, nextPage);
      setSuggestions((prev) => {
        // avoid duplicates if any
        const existingIds = new Set(prev.map((i) => i.id));
        const fresh = res.data.filter((i) => !existingIds.has(i.id));
        return [...prev, ...fresh];
      });
      setPage(nextPage);
      setHasMore(res.pagination.current_page < res.pagination.last_page);
    } catch {
      // keep current list
    } finally {
      setIsLoadingMore(false);
    }
  }, [activeQuery, isLoadingMore, isSearching, hasMore, page, project.id]);

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

  const handleCategory = (id: string) => {
    form.setValue("categoryId", id);
    form.setValue("typeId", "");
    setLocalError(null);
    setOpenMenu(null);
  };

  const handleSuggestion = (apartmentId: string) => {
    const item = suggestions.find((s) => String(s.id) === apartmentId);
    if (!item) return;

    form.setValue("query", item.apartment_number);
    setOpenMenu(null);

    submitChoice({
      unitId: item.apartment_number,
      levelName: "",
      layoutCode: item.layout.code,
    });
  };

  const handleSubmit = (values: FormValues) => {
    const trimmed = values.query.trim();

    if (trimmed && isDesignCode(trimmed)) {
      submitChoice({
        unitId: "",
        levelName: "",
        designCode: normalizeDesignCode(trimmed),
      });
      return;
    }

    if (trimmed) {
      const exact = suggestions.find(
        (s) => s.apartment_number.toLowerCase() === trimmed.toLowerCase(),
      );
      if (exact) {
        submitChoice({
          unitId: exact.apartment_number,
          levelName: "",
          layoutCode: exact.layout.code,
        });
        return;
      }
    }

    if (values.categoryId && values.typeId) {
      const type = typeOptions.find((t) => t.id === values.typeId);
      if (type) {
        submitChoice({
          unitId: "",
          levelName: "",
          layoutCode: type.layoutCode,
        });
        return;
      }
    }

    setLocalError(
      trimmed
        ? "We couldn’t find that unit. Try a unit number or choose type and layout."
        : "Search for a unit number, or select residence type and layout.",
    );
  };

  const showSearchDropdown =
    openMenu === "search" &&
    (isSearching || isLoadingMore || suggestions.length > 0 || query.trim());

  return (
    <Form {...form}>
      <form
        ref={rootRef}
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex w-full max-w-116.5 flex-col items-stretch gap-9"
        data-lenis-prevent
      >
        <h1
          id={headingId}
          className="text-center font-baskerville text-[clamp(22px,6vw,27.4px)] leading-[1.16] font-normal tracking-wider text-[#f2e9d8] capitalize"
        >
          {title}
        </h1>

        <div className="flex flex-col gap-6">
          {/* Search */}
          <div className="relative">
            <FormField
              control={form.control}
              name="query"
              render={({ field }) => (
                <FormItem className="space-y-0">
                  <FormControl>
                    <label className="flex w-full items-center gap-2 border-b border-dashed border-white/35 py-3.5">
                      <span className="sr-only">Search for unit number</span>
                      <input
                        {...field}
                        ref={(el) => {
                          field.ref(el);
                          inputRef.current = el;
                        }}
                        onChange={(e) => {
                          field.onChange(e);
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
                  </FormControl>
                </FormItem>
              )}
            />

            {showSearchDropdown ? (
              <OptionList
                options={suggestions.map((item) => ({
                  id: String(item.id),
                  label: `${item.apartment_number} - ${item.layout.category.name} - ${item.layout.type.name} - ${item.layout.area} sq ft`,
                }))}
                isLoading={isSearching}
                isLoadingMore={isLoadingMore}
                hasMore={hasMore}
                onSelect={handleSuggestion}
                onLoadMore={loadMore}
              />
            ) : null}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-px min-w-0 flex-1 bg-white/10" />
            <span className="text-[12px] tracking-[0.04em] text-white">OR</span>
            <span className="h-px min-w-0 flex-1 bg-white/10" />
          </div>

          {/* Dropdowns */}
          <div className="flex items-center gap-5">
            <DashedDropdown
              label="Residence type"
              value={categoryId}
              placeholder="Select Residence Type"
              options={categories}
              open={openMenu === "type"}
              onToggle={() =>
                setOpenMenu((v) => (v === "type" ? null : "type"))
              }
              onChange={handleCategory}
            />

            <DashedDropdown
              label="Layout"
              value={typeId}
              placeholder="Select Layout"
              options={typeOptions}
              open={openMenu === "layout"}
              disabled={!categoryId}
              onToggle={() =>
                setOpenMenu((v) => (v === "layout" ? null : "layout"))
              }
              onChange={(id) => {
                form.setValue("typeId", id);
                setLocalError(null);
                setOpenMenu(null);
              }}
            />
          </div>

          {(localError || error) && (
            <p
              role="alert"
              className="text-[12px] leading-[1.4] text-[#e29584]"
            >
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
    </Form>
  );
};

export default SelectStep;
