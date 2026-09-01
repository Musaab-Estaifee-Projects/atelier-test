/* eslint-disable @typescript-eslint/no-explicit-any */
// "use client";

// import { useRef, useEffect, ReactNode, CSSProperties } from "react";

// interface CustomShapeProps {
//   children: ReactNode;
//   radius?: number;
//   className?: string;
//   style?: CSSProperties;
//   fill?: string;
//   stroke?: string;
//   strokeWidth?: number;
// }

// const CustomShape = ({
//   children,
//   radius = 20,
//   className = "",
//   style,
//   fill = "rgba(255,255,255,0.08)",
//   stroke = "rgba(255,255,255,0.2)",
//   strokeWidth = 1,
// }: CustomShapeProps) => {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const pathRef = useRef<SVGPathElement>(null);

//   useEffect(() => {
//     const container = containerRef.current;
//     const path = pathRef.current;
//     if (!container || !path) return;

//     const updatePath = () => {
//       const w = container.clientWidth;
//       const h = container.clientHeight;

//       const r = Math.min(radius, w / 2, h / 2);

//       const d = `
//         M ${w - r} 0
//         L ${r} 0
//         A ${r} ${r} 0 0 1 0 ${r}
//         L 0 ${h - r}
//         A ${r} ${r} 0 0 1 ${r} ${h}
//         L ${w - r} ${h}
//         A ${r} ${r} 0 0 1 ${w} ${h - r}
//         L ${w} ${r}
//         A ${r} ${r} 0 0 1 ${w - r} 0
//         Z
//       `;

//       path.setAttribute("d", d);
//     };

//     updatePath();

//     const observer = new ResizeObserver(() => {
//       requestAnimationFrame(updatePath);
//     });

//     observer.observe(container);

//     return () => observer.disconnect();
//   }, [radius]);

//   return (
//     <div ref={containerRef} className={`relative ${className}`} style={style}>
//       <svg
//         className="absolute inset-0 w-full h-full pointer-events-none"
//         xmlns="http://www.w3.org/2000/svg"
//         fill="none"
//         style={{ display: "block" }}
//       >
//         <path
//           ref={pathRef}
//           fill={fill}
//           stroke={stroke}
//           strokeWidth={strokeWidth}
//         />
//       </svg>

//       <div className="relative z-10 h-full w-full">{children}</div>
//     </div>
//   );
// };

// export default CustomShape;

// "use client";

// import {
//   forwardRef,
//   useEffect,
//   useId,
//   useRef,
//   type ReactNode,
//   type ElementType,
//   type CSSProperties,
// } from "react";

// type CustomShapeOwnProps = {
//   children: ReactNode;
//   /** Corner radius in px. Original SVG ≈ 26 */
//   radius?: number;
//   fill?: string;
//   /** Optional second color → creates a vertical linear gradient */
//   fillTo?: string;
//   stroke?: string;
//   strokeWidth?: number;
//   /** Stroke opacity 0–1 (original ≈ 0.1) */
//   strokeOpacity?: number;
//   as?: ElementType;
//   className?: string;
//   style?: CSSProperties;
// };

// type CustomShapeProps = CustomShapeOwnProps &
//   Omit<React.HTMLAttributes<HTMLDivElement>, keyof CustomShapeOwnProps>;

// export const CustomShape = forwardRef<HTMLDivElement, CustomShapeProps>(
//   (
//     {
//       children,
//       radius = 26,
//       fill = "#00272D",
//       fillTo,
//       stroke = "#ffffff",
//       strokeWidth = 1,
//       strokeOpacity = 0.1,
//       as: Component = "div",
//       className = "",
//       style,
//       ...rest
//     },
//     ref,
//   ) => {
//     const containerRef = useRef<HTMLDivElement>(null);
//     const pathRef = useRef<SVGPathElement>(null);
//     const strokePathRef = useRef<SVGPathElement>(null);
//     const uid = useId().replace(/:/g, "");

//     const setRefs = (node: HTMLDivElement | null) => {
//       (containerRef as React.MutableRefObject<HTMLDivElement | null>).current =
//         node;
//       if (typeof ref === "function") ref(node);
//       else if (ref)
//         (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
//     };

//     useEffect(() => {
//       const container = containerRef.current;
//       const path = pathRef.current;
//       const strokePath = strokePathRef.current;
//       if (!container || !path) return;

//       const updatePath = () => {
//         const w = container.clientWidth;
//         const h = container.clientHeight;
//         if (w <= 0 || h <= 0) return;

//         // Never let the radius collapse the shape
//         const r = Math.max(
//           0,
//           Math.min(
//             radius,
//             (w - strokeWidth) / 2 - 1,
//             (h - strokeWidth) / 2 - 1,
//           ),
//         );

//         // Small inset so the stroke stays inside the filled shape
//         const pad = strokeWidth / 2;

//         // Clockwise path with outward circular corners (matches original look)
//         const d = [
//           `M ${r + pad} ${pad}`,
//           `L ${w - r - pad} ${pad}`,
//           `A ${r} ${r} 0 0 1 ${w - pad} ${r + pad}`,
//           `L ${w - pad} ${h - r - pad}`,
//           `A ${r} ${r} 0 0 1 ${w - r - pad} ${h - pad}`,
//           `L ${r + pad} ${h - pad}`,
//           `A ${r} ${r} 0 0 1 ${pad} ${h - r - pad}`,
//           `L ${pad} ${r + pad}`,
//           `A ${r} ${r} 0 0 1 ${r + pad} ${pad}`,
//           `Z`,
//         ].join(" ");

//         path.setAttribute("d", d);
//         if (strokePath) strokePath.setAttribute("d", d);
//       };

//       updatePath();

//       const observer = new ResizeObserver(() => {
//         requestAnimationFrame(updatePath);
//       });
//       observer.observe(container);
//       window.addEventListener("resize", updatePath);

//       return () => {
//         observer.disconnect();
//         window.removeEventListener("resize", updatePath);
//       };
//     }, [radius, strokeWidth]);

//     const gradientId = `fill-${uid}`;
//     const maskId = `mask-${uid}`;

//     return (
//       <Component
//         ref={setRefs}
//         className={`relative ${className}`}
//         style={{
//           background: "transparent",
//           ...style,
//         }}
//         {...rest}
//       >
//         <svg
//           className="pointer-events-none absolute inset-0 h-full w-full"
//           xmlns="http://www.w3.org/2000/svg"
//           fill="none"
//           overflow="visible"
//         >
//           <defs>
//             {fillTo && (
//               <linearGradient
//                 id={gradientId}
//                 x1="0"
//                 y1="0"
//                 x2="0"
//                 y2="1"
//                 gradientUnits="objectBoundingBox"
//               >
//                 <stop offset="0" stopColor={fill} stopOpacity="0.98" />
//                 <stop offset="1" stopColor={fillTo} stopOpacity="0.98" />
//               </linearGradient>
//             )}

//             <mask id={maskId} fill="white">
//               <path ref={pathRef} />
//             </mask>
//           </defs>

//           {/* Main shape */}
//           <path ref={pathRef} fill={fillTo ? `url(#${gradientId})` : fill} />

//           {/* Subtle inner stroke (same technique as the original SVG) */}
//           {strokeWidth > 0 && (
//             <path
//               ref={strokePathRef}
//               fill="none"
//               stroke={stroke}
//               strokeWidth={strokeWidth}
//               strokeOpacity={strokeOpacity}
//               strokeLinejoin="round"
//               strokeLinecap="round"
//               vectorEffect="non-scaling-stroke"
//               mask={`url(#${maskId})`}
//             />
//           )}
//         </svg>

//         {/* Content is centered by default */}
//         <div className="relative z-10 flex h-full w-full items-center justify-center">
//           {children}
//         </div>
//       </Component>
//     );
//   },
// );

// CustomShape.displayName = "CustomShape";

// "use client";

// import {
//   forwardRef,
//   useEffect,
//   useId,
//   useRef,
//   type ReactNode,
//   type ElementType,
// } from "react";
// import { motion, type HTMLMotionProps } from "motion/react";

// type ResponsiveRadius = {
//   base?: number;
//   sm?: number;
//   md?: number;
//   lg?: number;
//   xl?: number;
//   "2xl"?: number;
// };

// type CustomShapeOwnProps = {
//   children: ReactNode;
//   radius?: number | ResponsiveRadius;
//   fill?: string;
//   stroke?: string;
//   strokeWidth?: number;
//   /** Noise opacity applied only inside the shape (0 = disabled) */
//   noiseOpacity?: number;
//   as?: ElementType;
//   className?: string;
// };

// type CustomShapeProps = CustomShapeOwnProps &
//   Omit<HTMLMotionProps<"div">, keyof CustomShapeOwnProps>;

// const breakpoints = {
//   base: 0,
//   sm: 640,
//   md: 768,
//   lg: 1024,
//   xl: 1280,
//   "2xl": 1536,
// } as const;

// function resolveRadius(
//   radius: number | ResponsiveRadius | undefined,
//   width: number,
// ): number {
//   if (typeof radius === "number") return radius;
//   if (!radius) return 20;

//   const sorted = (
//     Object.entries(breakpoints) as [keyof typeof breakpoints, number][]
//   ).sort((a, b) => b[1] - a[1]);

//   for (const [key, minWidth] of sorted) {
//     if (width >= minWidth && radius[key] !== undefined) {
//       return radius[key]!;
//     }
//   }

//   return radius.base ?? 20;
// }

// function createNoiseDataUrl() {
//   const svg = `<svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
//     <filter id="n">
//       <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch"/>
//     </filter>
//     <rect width="100%" height="100%" filter="url(#n)"/>
//   </svg>`;
//   return `data:image/svg+xml,${encodeURIComponent(svg)}`;
// }

// export const CustomShape = forwardRef<HTMLDivElement, CustomShapeProps>(
//   (
//     {
//       children,
//       radius = 20,
//       fill = "rgba(255,255,255,0.08)",
//       stroke = "rgba(255,255,255,0.4)",
//       strokeWidth = 1,
//       noiseOpacity = 0,
//       as: Component = "div",
//       className = "",
//       style,
//       onClick,
//       ...motionProps
//     },
//     ref,
//   ) => {
//     const containerRef = useRef<HTMLDivElement>(null);
//     const pathRef = useRef<SVGPathElement>(null);
//     const clipPathRef = useRef<SVGPathElement>(null);
//     const uid = useId().replace(/:/g, "");

//     const setRefs = (node: HTMLDivElement | null) => {
//       (containerRef as any).current = node;
//       if (typeof ref === "function") ref(node);
//       else if (ref) (ref as any).current = node;
//     };

//     useEffect(() => {
//       const container = containerRef.current;
//       const path = pathRef.current;
//       const clipPath = clipPathRef.current;
//       if (!container || !path) return;

//       const updatePath = () => {
//         const w = container.clientWidth;
//         const h = container.clientHeight;
//         if (w <= 0 || h <= 0) return;

//         const currentRadius = resolveRadius(radius, window.innerWidth);
//         const pad = strokeWidth / 2 + 0.5;

//         const r = Math.max(
//           0,
//           Math.min(
//             currentRadius,
//             (w - strokeWidth) / 2 - 1,
//             (h - strokeWidth) / 2 - 1,
//           ),
//         );

//         const d = [
//           `M ${w - r - pad} ${pad}`,
//           `L ${r + pad} ${pad}`,
//           `A ${r} ${r} 0 0 1 ${pad} ${r + pad}`,
//           `L ${pad} ${h - r - pad}`,
//           `A ${r} ${r} 0 0 1 ${r + pad} ${h - pad}`,
//           `L ${w - r - pad} ${h - pad}`,
//           `A ${r} ${r} 0 0 1 ${w - pad} ${h - r - pad}`,
//           `L ${w - pad} ${r + pad}`,
//           `A ${r} ${r} 0 0 1 ${w - r - pad} ${pad}`,
//           `Z`,
//         ].join(" ");

//         path.setAttribute("d", d);
//         if (clipPath) clipPath.setAttribute("d", d);
//       };

//       updatePath();

//       const observer = new ResizeObserver(() => {
//         requestAnimationFrame(updatePath);
//       });

//       observer.observe(container);
//       window.addEventListener("resize", updatePath);

//       return () => {
//         observer.disconnect();
//         window.removeEventListener("resize", updatePath);
//       };
//     }, [radius, strokeWidth]);

//     const MotionComponent = motion(Component as any);
//     const noiseId = `noise-${uid}`;
//     const clipId = `clip-${uid}`;

//     return (
//       <MotionComponent
//         ref={setRefs}
//         className={`relative bg-transparent ${className}`}
//         style={
//           {
//             backgroundColor: "transparent",
//             background: "transparent",
//             "--shape-fill": fill,
//             ...style,
//           } as React.CSSProperties
//         }
//         onClick={onClick}
//         {...motionProps}
//       >
//         <svg
//           className="pointer-events-none absolute inset-0 h-full w-full"
//           xmlns="http://www.w3.org/2000/svg"
//           fill="none"
//           overflow="visible"
//         >
//           <defs>
//             <clipPath id={clipId}>
//               <path ref={clipPathRef} />
//             </clipPath>

//             {noiseOpacity > 0 && (
//               <pattern
//                 id={noiseId}
//                 patternUnits="userSpaceOnUse"
//                 width="180"
//                 height="180"
//               >
//                 <image
//                   href={createNoiseDataUrl()}
//                   width="180"
//                   height="180"
//                   preserveAspectRatio="none"
//                 />
//               </pattern>
//             )}
//           </defs>

//           {/* Main shape */}
//           <path
//             ref={pathRef}
//             fill="var(--shape-fill)"
//             stroke={stroke}
//             strokeWidth={strokeWidth}
//             strokeLinejoin="round"
//             strokeLinecap="round"
//             vectorEffect="non-scaling-stroke"
//           />

//           {/* Noise (strictly clipped to the shape) */}
//           {noiseOpacity > 0 && (
//             <rect
//               width="100%"
//               height="100%"
//               fill={`url(#${noiseId})`}
//               clipPath={`url(#${clipId})`}
//               opacity={noiseOpacity}
//               style={{ mixBlendMode: "overlay" }}
//             />
//           )}
//         </svg>

//         <div className="relative z-10 h-full w-full">{children}</div>
//       </MotionComponent>
//     );
//   },
// );

// CustomShape.displayName = "CustomShape";

"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type ReactNode,
  type ElementType,
  type CSSProperties,
  type HTMLAttributes,
} from "react";

type ResponsiveValue<T> =
  | T
  | { base?: T; sm?: T; md?: T; lg?: T; xl?: T; "2xl"?: T };

type CustomShapeOwnProps = {
  children?: ReactNode;
  /**
   * Size of the characteristic corner cut (px).
   * Matches the original SVG's ~26px treatment.
   * Can be responsive: { base: 20, md: 26, lg: 32 }
   */
  radius?: ResponsiveValue<number>;
  /** Solid color or any valid CSS fill. Pass "gradient" (default) for the original teal gradient. */
  fill?: string;
  /** Border color */
  stroke?: string;
  /** Border width in CSS pixels */
  strokeWidth?: number;
  /** Polymorphic root element */
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
};

type CustomShapeProps = CustomShapeOwnProps &
  Omit<HTMLAttributes<HTMLElement>, keyof CustomShapeOwnProps>;

const BREAKPOINTS = {
  base: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

function resolve<T>(
  value: ResponsiveValue<T> | undefined,
  fallback: T,
  viewportWidth: number,
): T {
  if (value === undefined) return fallback;
  if (typeof value !== "object" || value === null) return value as T;

  const sorted = (
    Object.entries(BREAKPOINTS) as [keyof typeof BREAKPOINTS, number][]
  ).sort((a, b) => b[1] - a[1]);

  for (const [key, min] of sorted) {
    if (viewportWidth >= min && (value as any)[key] !== undefined) {
      return (value as any)[key];
    }
  }
  return (value as any).base ?? fallback;
}

/**
 * Builds the exact corner geometry from the original design.
 * The original path uses cubic beziers that create a soft "notch"
 * rather than a pure circular arc. We keep that character.
 */
function buildPath(w: number, h: number, r: number): string {
  const maxR = Math.min(w, h) * 0.5 - 0.5;
  const R = Math.max(0, Math.min(r, maxR));

  // Control ratios derived from the original SVG path
  const c1x = 0.01;
  const c1y = 0.547;
  const c2x = 0.462;
  const c2y = 0.97;

  return [
    `M ${w - R} 0`,
    // top-right
    `C ${w - R + R * c1x} ${R * c1y} ${w - R + R * c2x} ${R * c2y} ${w} ${R}`,
    `L ${w} ${h - R}`,
    // bottom-right
    `C ${w - R * c1y} ${h - R + R * c1x} ${w - R * c2y} ${h - R + R * c2x} ${w - R} ${h}`,
    `L ${R} ${h}`,
    // bottom-left
    `C ${R - R * c1x} ${h - R * c1y} ${R - R * c2x} ${h - R * c2y} 0 ${h - R}`,
    `L 0 ${R}`,
    // top-left
    `C ${R * c1y} ${R - R * c1x} ${R * c2y} ${R - R * c2x} ${R} 0`,
    `Z`,
  ].join(" ");
}

export const CustomShape = forwardRef<HTMLElement, CustomShapeProps>(
  (
    {
      children,
      radius = 26,
      fill = "gradient",
      stroke = "rgba(255,255,255,0.102)",
      strokeWidth = 1,
      as: Component = "div",
      className = "",
      style,
      ...rest
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLElement | null>(null);
    const pathRef = useRef<SVGPathElement>(null);
    const uid = useId().replace(/:/g, "");

    const setRefs = (node: HTMLElement | null) => {
      containerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) {
        (ref as React.MutableRefObject<HTMLElement | null>).current = node;
      }
    };

    useEffect(() => {
      const el = containerRef.current;
      const path = pathRef.current;
      if (!el || !path) return;

      let rafId = 0;

      const paint = () => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        if (w < 1 || h < 1) return;

        const r = resolve(radius, 26, window.innerWidth);
        path.setAttribute("d", buildPath(w, h, r));
      };

      const schedule = () => {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(paint);
      };

      paint();

      const ro = new ResizeObserver(schedule);
      ro.observe(el);
      window.addEventListener("resize", schedule, { passive: true });

      return () => {
        cancelAnimationFrame(rafId);
        ro.disconnect();
        window.removeEventListener("resize", schedule);
      };
    }, [radius]);

    const gradientId = `g-${uid}`;
    const useGradient = fill === "gradient";

    return (
      <Component
        ref={setRefs}
        className={`relative isolate ${className}`}
        style={{ background: "transparent", ...style }}
        {...rest}
      >
        <svg
          className="pointer-events-none absolute inset-0 size-full"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          aria-hidden
        >
          {useGradient && (
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop stopColor="#00272D" stopOpacity="0.98" />
                <stop offset="1" stopColor="#003E47" stopOpacity="0.98" />
              </linearGradient>
            </defs>
          )}

          <path
            ref={pathRef}
            fill={useGradient ? `url(#${gradientId})` : fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Content – centered by default, perfect for dialogs */}
        <div className="relative z-10 flex size-full flex-col items-center justify-center">
          {children}
        </div>
      </Component>
    );
  },
);

CustomShape.displayName = "CustomShape";
