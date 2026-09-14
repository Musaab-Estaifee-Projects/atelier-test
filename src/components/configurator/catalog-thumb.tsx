"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { catalogImageUrl } from "@/lib/configurator/chrome";
import { cn } from "@/lib/utils";

type Props = {
  src?: string | null;
  alt?: string;
  className?: string;
  iconClassName?: string;
  sizes?: string;
};

export default function CatalogThumb({
  src,
  alt = "",
  className,
  iconClassName,
  sizes = "80px",
}: Props) {
  const url = catalogImageUrl(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFailed(false);
  }, [url]);

  const showImage = Boolean(url) && !failed;
  const remote = Boolean(url && /^https?:\/\//i.test(url));

  return (
    <span className={cn("relative block overflow-clip", className)}>
      {showImage && url ? (
        <Image
          src={url}
          alt={alt}
          fill
          className="object-cover"
          sizes={sizes}
          unoptimized={remote}
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-white/10">
          <ImageOff
            className={cn("size-[42%] text-white/45", iconClassName)}
            strokeWidth={1.4}
            aria-hidden
          />
        </span>
      )}
    </span>
  );
}
