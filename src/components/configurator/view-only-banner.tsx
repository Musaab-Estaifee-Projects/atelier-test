"use client";

type Props = {
  designCode: string;
  onStartOwn: () => void;
};

export default function ViewOnlyBanner({ designCode, onStartOwn }: Props) {
  return (
    <div className="absolute left-1/2 top-3 z-30 flex max-w-[min(560px,calc(100vw-1.5rem))] -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-full border border-white/10 bg-black/65 px-4 py-2 text-xs text-white backdrop-blur">
      <span>
        Viewing design <span className="font-mono">{designCode}</span>{" "}
        (read-only)
      </span>
      <button
        type="button"
        className="rounded-full bg-white/15 px-3 py-1 hover:bg-white/25"
        onClick={onStartOwn}
      >
        Start my own design
      </button>
    </div>
  );
}
