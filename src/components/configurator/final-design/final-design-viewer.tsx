/* eslint-disable react-hooks/set-state-in-effect */
// "use client";

// import { useEffect, useState } from "react";
// import Image from "next/image";
// import { ArrowLeft, ArrowRight, X } from "lucide-react";

// export type LightboxStill = {
//   cameraName: string;
//   cameraLabel: string;
//   zoneId: string;
//   zoneName: string;
//   label: string;
//   imageUrl: string;
// };

// type Props = {
//   stills: LightboxStill[];
//   index: number | null;
//   onIndexChange: (index: number) => void;
//   onClose: () => void;
// };

// export default function FinalDesignViewer({
//   stills,
//   index,
//   onIndexChange,
//   onClose,
// }: Props) {
//   const [touchX, setTouchX] = useState<number | null>(null);
//   const [cachedIndex, setCachedIndex] = useState(0);
//   const [hasOpened, setHasOpened] = useState(false);

//   useEffect(() => {
//     if (index == null) return;

//     setCachedIndex(index);
//     setHasOpened(true);
//   }, [index]);

//   const shownIndex = index ?? cachedIndex;
//   const current = stills[shownIndex];
//   const open = index != null && Boolean(current);

//   useEffect(() => {
//     if (!open) return;
//     const onKey = (event: KeyboardEvent) => {
//       if (event.key === "Escape") onClose();
//       if (event.key === "ArrowRight" && stills.length) {
//         onIndexChange((index! + 1) % stills.length);
//       }
//       if (event.key === "ArrowLeft" && stills.length) {
//         onIndexChange((index! - 1 + stills.length) % stills.length);
//       }
//     };
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [open, index, stills.length, onClose, onIndexChange]);

//   if (!current) return null;
//   if (index == null && !hasOpened) return null;
//   const hasMany = stills.length > 1;

//   const goPrev = () =>
//     onIndexChange((shownIndex - 1 + stills.length) % stills.length);
//   const goNext = () => onIndexChange((shownIndex + 1) % stills.length);

//   return (
//     <div
//       className={open ? "fixed inset-0 z-80 flex flex-col bg-black" : "hidden"}
//       role="dialog"
//       aria-modal={open}
//       aria-hidden={!open}
//       aria-label={current.label}
//     >
//       <button
//         type="button"
//         className="absolute inset-0 cursor-zoom-out"
//         aria-label="Close"
//         onClick={onClose}
//       />
//       <button
//         type="button"
//         className="absolute top-4 right-4 z-20 flex size-10 items-center justify-center text-white/80 hover:text-white"
//         onClick={onClose}
//         aria-label="Close"
//       >
//         <X className="size-6" strokeWidth={1.5} />
//       </button>

//       <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-2 pb-4 pt-12 sm:px-4">
//         <div
//           className="relative h-[min(82dvh,calc(100dvh-8.5rem))] w-[min(98vw,1920px)]"
//           onTouchStart={(e) => setTouchX(e.touches[0]?.clientX ?? null)}
//           onTouchEnd={(e) => {
//             if (touchX == null) return;
//             const dx = (e.changedTouches[0]?.clientX ?? touchX) - touchX;
//             if (Math.abs(dx) > 40 && hasMany) {
//               if (dx < 0) goNext();
//               else goPrev();
//             }
//             setTouchX(null);
//           }}
//         >
//           <Image
//             src={current.imageUrl}
//             alt={current.label}
//             fill
//             unoptimized
//             quality={100}
//             className="object-contain"
//             sizes="100vw"
//           />

//           {hasMany ? (
//             <>
//               <button
//                 type="button"
//                 onClick={goPrev}
//                 aria-label="Previous render"
//                 className="absolute top-1/2 left-2 z-10 flex size-8 -translate-y-1/2 items-center justify-center text-white/80 hover:text-white sm:left-4 bg-white/10 hover:bg-white/40 transition-all duration-300 rounded-full cursor-pointer"
//               >
//                 <ArrowLeft className="size-5!" strokeWidth={1} />
//               </button>
//               <button
//                 type="button"
//                 onClick={goNext}
//                 aria-label="Next render"
//                 className="absolute top-1/2 right-2 z-10 flex size-8 -translate-y-1/2 items-center justify-center text-white/80 hover:text-white sm:right-4 bg-white/10 hover:bg-white/40 transition-all duration-300 rounded-full cursor-pointer"
//               >
//                 <ArrowRight className="size-5!" strokeWidth={1} />
//               </button>
//             </>
//           ) : null}
//         </div>

//         <p className="mt-4 max-w-full px-4 text-center text-[12px] font-medium tracking-[0.12em] text-white uppercase sm:text-[13px]">
//           {current.zoneName} - {current.cameraLabel}
//         </p>
//         <p className="mt-1 text-center text-[12px] text-white/55">
//           {shownIndex + 1}/{stills.length}
//         </p>
//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import RenderS3Image from "@/components/configurator/final-design/render-s3-image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";

export type LightboxStill = {
  cameraName: string;
  cameraLabel: string;
  zoneId: string;
  zoneName: string;
  label: string;
  imageUrl: string;
};

type Props = {
  stills: LightboxStill[];
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

const FinalDesignViewer = ({
  stills,
  index,
  onIndexChange,
  onClose,
}: Props) => {
  const [api, setApi] = useState<CarouselApi>();
  const [cachedIndex, setCachedIndex] = useState(0);
  const [hasOpened, setHasOpened] = useState(false);

  const n = stills.length;
  const hasMany = n > 1;
  const shownIndex = index ?? cachedIndex;
  const still = stills[shownIndex];
  const open = index != null && Boolean(still);

  useEffect(() => {
    if (index == null) return;
    setCachedIndex(index);
    setHasOpened(true);
  }, [index]);

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      onIndexChange(api.selectedScrollSnap());
    };

    api.on("select", onSelect);
    onSelect();

    return () => {
      api.off("select", onSelect);
    };
  }, [api, onIndexChange]);

  useEffect(() => {
    if (!api || index == null) return;
    if (api.selectedScrollSnap() !== index) {
      api.scrollTo(index, true);
    }
  }, [api, index]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!still && !hasOpened) return null;

  return (
    <AnimatePresence>
      {open && still && (
        <motion.div
          key="lightbox"
          className="fixed inset-0 z-80 flex flex-col bg-black"
          role="dialog"
          aria-modal="true"
          aria-label={still.label}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {/* Backdrop */}
          <button
            type="button"
            className="absolute inset-0 cursor-zoom-out"
            aria-label="Close"
            onClick={onClose}
          />

          {/* Close */}
          <button
            type="button"
            className="absolute top-4 right-4 z-30 flex size-10 items-center justify-center text-white/80 hover:text-white"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-6" strokeWidth={1.5} />
          </button>

          <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-2 pb-4 pt-12 sm:px-4">
            <div className="relative h-[min(82dvh,calc(100dvh-8.5rem))] w-[min(98vw,1920px)]">
              <Carousel
                setApi={setApi}
                opts={{
                  loop: hasMany,
                  align: "center",
                  duration: 25,
                }}
                className="h-full w-full [&>div]:h-full [&>div>div]:h-full"
              >
                <CarouselContent className="h-full ml-0">
                  {stills.map((s, i) => (
                    <CarouselItem
                      key={`${s.zoneId}-${s.cameraName}-${i}`}
                      className="h-full basis-full pl-0"
                    >
                      <div className="relative h-full w-full">
                        <RenderS3Image
                          src={s.imageUrl}
                          alt={s.label}
                          fit="contain"
                          quality={100}
                          priority={Math.abs(i - shownIndex) <= 1}
                          sizes="100vw"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>

                {hasMany && (
                  <>
                    <CarouselPrevious
                      className="left-2 sm:left-4 size-8 border-0 bg-white/10 text-white hover:bg-white/40 hover:text-white disabled:opacity-50"
                      variant="ghost"
                    />
                    <CarouselNext
                      className="right-2 sm:right-4 size-8 border-0 bg-white/10 text-white hover:bg-white/40 hover:text-white disabled:opacity-50"
                      variant="ghost"
                    />
                  </>
                )}
              </Carousel>
            </div>

            <p className="mt-4 max-w-full px-4 text-center text-[12px] font-medium tracking-[0.12em] text-white uppercase sm:text-[13px]">
              {still.zoneName} - {still.cameraLabel}
            </p>
            <p className="mt-1 text-center text-[12px] text-white/55">
              {shownIndex + 1}/{n}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FinalDesignViewer;
