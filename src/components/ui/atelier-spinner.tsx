import { cn } from "@/lib/utils";

export function AtelierSpinner({
  className,
  sizeClassName = "size-[43px]",
}: {
  className?: string;
  sizeClassName?: string;
}) {
  return (
    <span
      className={cn("relative block", sizeClassName, className)}
      aria-hidden
    >
      <span className="absolute inset-0 rounded-full border border-[#f2e9d8]/25" />
      <span className="absolute inset-0 animate-spin rounded-full border border-transparent border-t-[#f2e9d8]" />
    </span>
  );
}
