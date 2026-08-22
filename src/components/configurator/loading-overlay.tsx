// src/components/configurator/LoadingOverlay.tsx
"use client";

type Props = {
  title: string;
  subtitle: string;
  status: string;
  progress: number;
};

export default function LoadingOverlay({
  title,
  subtitle,
  status,
  progress,
}: Props) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#18181A] text-white">
      <p className="mb-1 text-lg font-medium">{title}</p>
      <p className="mb-6 max-w-sm text-center text-sm text-white/60">
        {subtitle}
      </p>
      <div className="mb-2 h-1 w-48 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-[#4e9cff] transition-[width] duration-300"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      <p className="text-xs text-white/40">{status}</p>
    </div>
  );
}
