// src/components/configurator/price-summary.tsx
"use client";

type Props = {
  price: number;
  currency?: string;
  selectionCount: number;
  viewOnly?: boolean;
  onSubmit?: () => void;
  onReset?: () => void;
  submitDisabled?: boolean;
};

export default function PriceSummary({
  price,
  currency = "AED",
  selectionCount,
  viewOnly = false,
  onSubmit,
  onReset,
  submitDisabled = false,
}: Props) {
  return (
    <div className="absolute bottom-16 right-4 z-20 w-[min(260px,calc(100vw-2rem))] rounded-xl border border-white/10 bg-black/65 p-3 text-white backdrop-blur">
      <p className="text-[10px] uppercase tracking-wide opacity-55">
        {viewOnly ? "Design price" : "Estimate"}
      </p>
      <p className="text-lg font-medium">
        {currency} {price.toLocaleString()}
      </p>
      <p className="mb-2 text-xs opacity-55">
        {selectionCount} selection{selectionCount === 1 ? "" : "s"}
      </p>
      {!viewOnly && (
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            className="rounded-lg bg-[#4e9cff] px-3 py-2 text-xs text-white disabled:opacity-40"
            onClick={onSubmit}
            disabled={submitDisabled || selectionCount === 0}
          >
            Submit design
          </button>
          <button
            type="button"
            className="rounded-lg bg-white/10 px-3 py-2 text-xs hover:bg-white/15"
            onClick={onReset}
          >
            Reset design
          </button>
        </div>
      )}
    </div>
  );
}
