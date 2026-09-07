"use client";

import { useRef, useCallback } from "react";

type Props = {
  options: { id: string; label: string }[];
  value?: string;
  labelledBy?: string;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onSelect: (id: string) => void;
  onLoadMore?: () => void;
};

const OptionList = ({
  options,
  value,
  labelledBy,
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  onSelect,
  onLoadMore,
}: Props) => {
  const listRef = useRef<HTMLUListElement>(null);

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el || !onLoadMore || !hasMore || isLoadingMore || isLoading) return;

    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (nearBottom) {
      onLoadMore();
    }
  }, [onLoadMore, hasMore, isLoadingMore, isLoading]);

  return (
    <ul
      ref={listRef}
      role="listbox"
      aria-labelledby={labelledBy}
      onScroll={handleScroll}
      className="absolute top-full left-0 z-30 mt-1 flex max-h-60 w-full flex-col gap-1.25 overflow-y-auto hidden-scrollbar bg-[#00272d] p-[5px] shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
    >
      {isLoading && options.length === 0 ? (
        <li className="flex items-center justify-center py-4">
          <div className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        </li>
      ) : options.length === 0 ? (
        <li className="px-2.5 py-2.5 text-[12px] leading-[1.2] text-white/50">
          No results
        </li>
      ) : (
        <>
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

          {isLoadingMore && (
            <li className="flex items-center justify-center py-3">
              <div className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            </li>
          )}
        </>
      )}
    </ul>
  );
};

export default OptionList;
