// import { CatalogStyle } from "@/lib/styles/catalog";
// import { demoCustomizeHref } from "../select-style";
// import Link from "next/link";

// const StyleCard = ({
//   style,
//   href,
//   onSelect,
// }: {
//   style: CatalogStyle;
//   href?: string;
//   onSelect?: () => void;
// }) => {
//   const inner = (
//     <>
//       {/* eslint-disable-next-line @next/next/no-img-element */}
//       <img
//         src="/images/styles/card-frame.svg"
//         alt=""
//         className="pointer-events-none absolute inset-0 h-full w-full"
//       />
//       <div className="relative z-10 flex h-full flex-col gap-[13px] p-[25px]">
//         <h2 className="text-center font-baskerville text-[clamp(20px,2vw,25px)] leading-[1.16] font-normal tracking-[0.05em] text-[#f2e9d8] uppercase">
//           {style.name}
//         </h2>
//         <div className="relative min-h-0 w-full flex-1 overflow-hidden bg-[#001b1f]">
//           {/* eslint-disable-next-line @next/next/no-img-element */}
//           <img
//             src={style.image}
//             alt=""
//             className="absolute inset-0 h-full w-full object-cover"
//           />
//         </div>
//         <p className="text-[10px] leading-[1.2] text-white/70">
//           {style.description}
//         </p>
//         <div className="flex items-center justify-center gap-1.5">
//           {style.swatches.map((color) => (
//             <span
//               key={color}
//               className="size-7 shrink-0 rounded-full"
//               style={{ backgroundColor: color }}
//             />
//           ))}
//         </div>
//       </div>
//     </>
//   );

//   const className =
//     "relative flex aspect-404/575 w-full flex-col text-left transition-transform hover:scale-[1.01]";

//   if (onSelect) {
//     return (
//       <button type="button" onClick={onSelect} className={className}>
//         {inner}
//       </button>
//     );
//   }

//   return (
//     <Link href={href ?? demoCustomizeHref(style.slug)} className={className}>
//       {inner}
//     </Link>
//   );
// };

// export default StyleCard;

// import { CatalogStyle } from "@/lib/styles/catalog";
// import { demoCustomizeHref } from "../select-style";
// import Link from "next/link";
// import { cn } from "@/lib/utils";

// type StyleCardProps = {
//   style: CatalogStyle;
//   href?: string;
//   onSelect?: () => void;
//   className?: string;
// };

// const StyleCard = ({ style, href, onSelect, className }: StyleCardProps) => {
//   const inner = (
//     <>
//       {/* eslint-disable-next-line @next/next/no-img-element */}
//       <img
//         src="/images/styles/card-frame.svg"
//         alt=""
//         className="pointer-events-none absolute inset-0 h-full w-full"
//       />
//       <div className="relative z-10 flex h-full flex-col gap-[13px] p-[25px]">
//         <h2 className="text-center font-baskerville text-[clamp(20px,2vw,25px)] leading-[1.16] font-normal tracking-[0.05em] text-[#f2e9d8] uppercase">
//           {style.name}
//         </h2>
//         <div className="relative min-h-0 w-full flex-1 overflow-hidden bg-[#001b1f]">
//           {/* eslint-disable-next-line @next/next/no-img-element */}
//           <img
//             src={style.image}
//             alt=""
//             className="absolute inset-0 h-full w-full object-cover"
//           />
//         </div>
//         <p className="text-[10px] leading-[1.2] text-white/70">
//           {style.description}
//         </p>
//         <div className="flex items-center justify-center gap-1.5">
//           {style.swatches.map((color) => (
//             <span
//               key={color}
//               className="size-7 shrink-0 rounded-full"
//               style={{ backgroundColor: color }}
//             />
//           ))}
//         </div>
//       </div>
//     </>
//   );

//   const baseClassName = cn(
//     "relative flex aspect-[404/575] w-full flex-col text-left",
//     className,
//   );

//   if (onSelect) {
//     return (
//       <button type="button" onClick={onSelect} className={baseClassName}>
//         {inner}
//       </button>
//     );
//   }

//   return (
//     <Link
//       href={href ?? demoCustomizeHref(style.slug)}
//       className={baseClassName}
//     >
//       {inner}
//     </Link>
//   );
// };

// export default StyleCard;
"use client";

import { CatalogStyle } from "@/lib/styles/catalog";
import { demoCustomizeHref } from "../select-style";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CustomShape } from "@/components/shared/custom-shape";

type StyleCardProps = {
  style: CatalogStyle;
  href?: string;
  onSelect?: () => void;
  className?: string;
};

const StyleCard = ({ style, href, onSelect, className }: StyleCardProps) => {
  const content = (
    <CustomShape
      className={cn(
        "relative h-full w-full overflow-hidden transition-transform",
        className,
      )}
      radius={{
        base: 18,
        sm: 20,
        md: 22,
        lg: 24,
      }}
      fill="rgba(255,255,255,0.04)"
      stroke="rgba(255,255,255,0.10)"
      strokeWidth={1}
    >
      <div className="flex h-full w-full flex-col gap-3 p-5 sm:gap-3.5 sm:p-6">
        <h2 className="shrink-0 text-center font-baskerville text-[clamp(18px,1.8vw,22px)] leading-[1.16] font-normal tracking-[0.05em] text-[#f2e9d8] uppercase">
          {style.name}
        </h2>

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[2px] bg-[#001b1f]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={style.image}
            alt={style.name}
            className="absolute inset-0 block h-full w-full object-cover"
          />
        </div>

        <p className="shrink-0 text-[10px] leading-[1.25] text-white/70 sm:text-[11px]">
          {style.description}
        </p>

        <div className="flex shrink-0 items-center justify-center gap-1.5">
          {style.swatches.map((color) => (
            <span
              key={color}
              className="size-6 shrink-0 rounded-full sm:size-7"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </CustomShape>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className="block h-full w-full text-left"
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={href ?? demoCustomizeHref(style.slug)}
      className="block h-full w-full"
    >
      {content}
    </Link>
  );
};

export default StyleCard;
