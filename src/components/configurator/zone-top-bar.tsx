// "use client";

// import AtelierLogo from "@/components/icons/atelier-logo";
// import ReefWord from "@/components/icons/reef-word";
// import type { CameraRule } from "@/types/configurator";
// import {
//   cameraKey,
//   surfaceDisplayLabel,
//   zoneDisplayLabel,
// } from "@/lib/configurator/zone-catalog";
// import ByWord from "../icons/by-word";

// type Props = {
//   zones: { id: string; label: string }[];
//   activeZoneId: string | null;
//   freeCameraActive: boolean;
//   onSelectZone: (zoneId: string) => void;
//   onFreeCamera: () => void;
//   cameras: CameraRule[];
//   activeCameraKey: string | null;
//   onSelectCamera: (camera: CameraRule) => void;
//   disabled?: boolean;
//   tourHighlight?: boolean;
// };

// const glassPill =
//   "pointer-events-auto flex max-w-[calc(100vw-24px)] items-center rounded-full border-[0.5px] border-white/25 bg-gradient-to-l from-[rgba(173,165,153,0.5)] to-[rgba(77,69,57,0.5)] p-1 backdrop-blur-[25px]";

// const chip =
//   "h-8 shrink-0 rounded-full border border-transparent px-[13px] font-sans font-medium text-[10px] uppercase tracking-[0.3px] text-white whitespace-nowrap outline-none transition hover:bg-white/10 focus:outline-none focus-visible:outline-none disabled:opacity-40 [-webkit-tap-highlight-color:transparent]";

// const ZoneTopBar = ({
//   zones,
//   activeZoneId,
//   freeCameraActive,
//   onSelectZone,
//   onFreeCamera,
//   cameras,
//   activeCameraKey,
//   onSelectCamera,
//   disabled,
//   tourHighlight,
// }: Props) => {
//   const zoneSelected = Boolean(activeZoneId);
//   const showSurfaces = zoneSelected && cameras.length > 0;

//   return (
//     <div
//       className={`cfg-zone-bar pointer-events-none absolute inset-x-0 top-0 z-[28] flex flex-col items-center gap-1.5 px-3 pt-[max(10px,env(safe-area-inset-top))] sm:gap-2 sm:pt-[max(14px,env(safe-area-inset-top))]${
//         tourHighlight ? " z-40" : ""
//       }`}
//       data-cfg-chrome
//       data-tour-target="zones"
//     >
//       <div className="flex flex-col items-center">
//         <AtelierLogo className="h-[1.6rem] w-auto" />
//         <ByWord className="mt-0.5 h-[5px] w-auto" />
//         <ReefWord className="mt-0.5 h-[0.4rem] w-auto" />
//       </div>

//       <nav className={glassPill} aria-label="Apartment zones">
//         <ul className="m-0 flex list-none items-center overflow-x-auto p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
//           {zones.map((z) => {
//             // const active =
//             //   !freeCameraActive && zoneSelected && activeZoneId === z.id;
//             const active = zoneSelected && activeZoneId === z.id;
//             return (
//               <li key={z.id}>
//                 <button
//                   type="button"
//                   className={`${chip}${active ? " bg-white/10" : " opacity-80"}`}
//                   disabled={disabled}
//                   onClick={() => onSelectZone(z.id)}
//                 >
//                   {zoneDisplayLabel(z.id)}
//                 </button>
//               </li>
//             );
//           })}

//           <li className="ml-1.5">
//             <button
//               type="button"
//               className={`${chip}${freeCameraActive ? " bg-blue-500" : " opacity-80"}`}
//               disabled={disabled}
//               onClick={onFreeCamera}
//               aria-pressed={freeCameraActive}
//               title="Free camera"
//             >
//               Free
//             </button>
//           </li>
//         </ul>
//       </nav>

//       {showSurfaces ? (
//         <nav className={glassPill} aria-label="Room surfaces">
//           <ul className="m-0 flex list-none items-center overflow-x-auto p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
//             {cameras.map((cam) => {
//               const key = cameraKey(cam);
//               // const active = activeCameraKey === key;
//               const active = !freeCameraActive && activeCameraKey === key;
//               return (
//                 <li key={key}>
//                   <button
//                     type="button"
//                     className={`${chip}${active ? " bg-white/10!" : " opacity-80 bg-transparent!"}`}
//                     disabled={disabled}
//                     onClick={() => onSelectCamera(cam)}
//                   >
//                     {surfaceDisplayLabel(cam)}
//                   </button>
//                 </li>
//               );
//             })}
//           </ul>
//         </nav>
//       ) : null}
//     </div>
//   );
// };

// export default ZoneTopBar;

"use client";

import AtelierLogo from "@/components/icons/atelier-logo";
import ReefWord from "@/components/icons/reef-word";
import type { CameraRule } from "@/types/configurator";
import {
  cameraKey,
  surfaceDisplayLabel,
  zoneDisplayLabel,
} from "@/lib/configurator/zone-catalog";
import ByWord from "../icons/by-word";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Props = {
  zones: { id: string; label: string }[];
  activeZoneId: string | null;
  freeCameraActive: boolean;
  onSelectZone: (zoneId: string) => void;
  onFreeCamera: () => void;
  cameras: CameraRule[];
  activeCameraKey: string | null;
  onSelectCamera: (camera: CameraRule) => void;
  disabled?: boolean;
  tourHighlight?: boolean;
};

type PProps = {
  children: ReactNode;
  "aria-label": string;
  className?: string; // the glassPill classes
  /** How much to scroll on each click (px). Defaults to ~70% of visible width */
  scrollAmount?: number;
};

const ScrollablePillNav = ({
  children,
  "aria-label": ariaLabel,
  className = "",
}: PProps) => {
  const scrollRef = useRef<HTMLUListElement>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const epsilon = 1; // tighter for better edge detection

    setCanScrollLeft(scrollLeft > epsilon);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - epsilon);
    setHasOverflow(scrollWidth > clientWidth + epsilon);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollState();

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(updateScrollState);
    });
    ro.observe(el);

    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("load", updateScrollState);

    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("load", updateScrollState);
    };
  }, [updateScrollState, children]);

  /** Scroll exactly to the next / previous chip */
  const scrollByItem = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;

    const items = Array.from(el.children) as HTMLElement[];
    if (items.length === 0) return;

    const containerLeft = el.scrollLeft;
    const containerRight = containerLeft + el.clientWidth;

    if (direction === "right") {
      const next = items.find((item) => {
        const itemRight = item.offsetLeft + item.offsetWidth;
        return itemRight > containerRight + 1;
      });

      if (next) {
        el.scrollTo({
          left: next.offsetLeft,
          behavior: "smooth",
        });
      }
    } else {
      // Go to the previous item, or force to the very start if we're close
      const prev = [...items].reverse().find((item) => {
        return item.offsetLeft < containerLeft - 1;
      });

      if (prev) {
        el.scrollTo({
          left: prev.offsetLeft,
          behavior: "smooth",
        });
      } else {
        // Safety: always land exactly at 0
        el.scrollTo({ left: 0, behavior: "smooth" });
      }
    }
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      {/* ── Left arrow ─────────────────────────────────────── */}
      {hasOverflow && (
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scrollByItem("left")}
          disabled={!canScrollLeft}
          className={`
            mr-1 flex h-8 w-8 shrink-0 items-center justify-center
            rounded-full border border-white/20
            bg-white/10
            text-white transition-all duration-200
            hover:bg-white/20 active:scale-95
            focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50
            disabled:opacity-30 disabled:pointer-events-none
          `}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}

      {/* ── Scrollable list ────────────────────────────────── */}
      <ul
        ref={scrollRef}
        className="
          m-0 flex min-w-0 flex-1 list-none items-center overflow-x-auto p-0
          [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
          scroll-smooth
        "
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {children}
      </ul>

      {/* ── Right arrow ────────────────────────────────────── */}
      {hasOverflow && (
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scrollByItem("right")}
          disabled={!canScrollRight}
          className={`
            ml-1 flex h-8 w-8 shrink-0 items-center justify-center
            rounded-full border border-white/20
            bg-white/10
            text-white transition-all duration-200
            hover:bg-white/20 active:scale-95
            focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50
            disabled:opacity-30 disabled:pointer-events-none
          `}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )}
    </div>
  );
};

const glassPill =
  "pointer-events-auto flex max-w-[calc(100vw-24px)] items-center rounded-full border-[0.5px] border-white/25 bg-gradient-to-l from-[rgba(173,165,153,0.5)] to-[rgba(77,69,57,0.5)] p-1 backdrop-blur-[25px]";

const chip =
  "h-8 shrink-0 rounded-full border border-transparent px-[13px] font-sans font-medium text-[10px] uppercase tracking-[0.3px] text-white whitespace-nowrap outline-none transition hover:bg-white/10 focus:outline-none focus-visible:outline-none disabled:opacity-40 [-webkit-tap-highlight-color:transparent]";

const ZoneTopBar = ({
  zones,
  activeZoneId,
  freeCameraActive,
  onSelectZone,
  onFreeCamera,
  cameras,
  activeCameraKey,
  onSelectCamera,
  disabled,
  tourHighlight,
}: Props) => {
  const zoneSelected = Boolean(activeZoneId);
  const showSurfaces = zoneSelected && cameras.length > 0;

  return (
    <div
      className={`cfg-zone-bar pointer-events-none absolute inset-x-0 top-0 z-[28] flex flex-col items-center gap-1.5 px-3 pt-[max(10px,env(safe-area-inset-top))] sm:gap-2 sm:pt-[max(14px,env(safe-area-inset-top))]${
        tourHighlight ? " z-40" : ""
      }`}
      data-cfg-chrome
      data-tour-target="zones"
    >
      <div className="flex flex-col items-center">
        <AtelierLogo className="h-[1.6rem] w-auto" />
        <ByWord className="mt-0.5 h-[5px] w-auto" />
        <ReefWord className="mt-0.5 h-[0.4rem] w-auto" />
      </div>

      {/* ── Zones + Free camera ─────────────────────────────── */}
      <ScrollablePillNav aria-label="Apartment zones" className={glassPill}>
        {zones.map((z) => {
          const active = zoneSelected && activeZoneId === z.id;
          return (
            <li key={z.id}>
              <button
                type="button"
                className={`${chip}${active ? " bg-white/10" : " opacity-80"}`}
                disabled={disabled}
                onClick={() => onSelectZone(z.id)}
              >
                {zoneDisplayLabel(z.id)}
              </button>
            </li>
          );
        })}

        <li className="ml-1.5">
          <button
            type="button"
            className={`${chip}${freeCameraActive ? " bg-blue-500" : " opacity-80"}`}
            disabled={disabled}
            onClick={onFreeCamera}
            aria-pressed={freeCameraActive}
            title="Free camera"
          >
            Free
          </button>
        </li>
      </ScrollablePillNav>

      {/* ── Surfaces / Cameras ─────────────────────────────── */}
      {showSurfaces ? (
        <ScrollablePillNav aria-label="Room surfaces" className={glassPill}>
          {cameras.map((cam) => {
            const key = cameraKey(cam);
            const active = !freeCameraActive && activeCameraKey === key;
            return (
              <li key={key}>
                <button
                  type="button"
                  className={`${chip}${
                    active ? " bg-white/10!" : " opacity-80 bg-transparent!"
                  }`}
                  disabled={disabled}
                  onClick={() => onSelectCamera(cam)}
                >
                  {surfaceDisplayLabel(cam)}
                </button>
              </li>
            );
          })}
        </ScrollablePillNav>
      ) : null}
    </div>
  );
};

export default ZoneTopBar;
