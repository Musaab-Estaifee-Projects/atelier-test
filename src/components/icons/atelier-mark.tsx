import Link from "next/link";
import AtelierLogo from "@/components/icons/atelier-logo";
import ByWord from "@/components/icons/by-word";
import ReefWord from "@/components/icons/reef-word";
import { cn } from "@/lib/utils";

type Props = {
  href?: string;
  label?: string;
  className?: string;
};

export default function AtelierMark({
  href,
  label = "Atelier home",
  className,
}: Props) {
  const mark = (
    <>
      <AtelierLogo className="h-[1.6rem] w-auto" />
      <ByWord className="mt-0.5 h-[5px] w-auto" />
      <ReefWord className="mt-0.5 h-[0.4rem] w-auto" />
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn("flex flex-col items-center", className)}
        aria-label={label}
      >
        {mark}
      </Link>
    );
  }

  return (
    <div className={cn("flex flex-col items-center", className)}>{mark}</div>
  );
}
