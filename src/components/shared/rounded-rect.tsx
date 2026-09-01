/* eslint-disable @typescript-eslint/no-explicit-any */
// "use client"; // needed if you use App Router + ResizeObserver

// import { useRef, useEffect, ReactNode, CSSProperties } from "react";

// interface ShapedCardProps {
//   children: ReactNode;
//   radius?: number;
//   className?: string;
//   style?: CSSProperties;
//   fill?: string;
//   stroke?: string;
//   strokeWidth?: number;
// }

// export function RoundedRect({
//   children,
//   radius = 20,
//   className = "",
//   style,
//   fill = "rgba(255,255,255,0.08)",
//   stroke = "rgba(255,255,255,0.2)",
//   strokeWidth = 1,
// }: ShapedCardProps) {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const pathRef = useRef<SVGPathElement>(null);

//   useEffect(() => {
//     const container = containerRef.current;
//     const path = pathRef.current;
//     if (!container || !path) return;

//     const updatePath = () => {
//       const w = container.clientWidth;
//       const h = container.clientHeight;

//       // Prevent radius from becoming larger than half the size
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

//     // Initial draw
//     updatePath();

//     const observer = new ResizeObserver(() => {
//       requestAnimationFrame(updatePath);
//     });

//     observer.observe(container);

//     return () => observer.disconnect();
//   }, [radius]);

//   return (
//     <div
//       ref={containerRef}
//       className={`relative ${className}`}
//       style={{
//         ...style,
//         clipPath: `inset(0 round ${radius}px)`, // or generate the same path
//       }}
//     >
//       {/* Background shape */}
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

//       {/* Content goes here – fully responsive */}
//       <div className="relative z-10 h-full w-full">{children}</div>
//     </div>
//   );
// }

// "use client";

// import {
//   forwardRef,
//   useEffect,
//   useRef,
//   type ReactNode,
//   type ElementType,
// } from "react";
// import { motion, type HTMLMotionProps } from "motion/react";

// type RoundedRectOwnProps = {
//   children: ReactNode;
//   radius?: number;
//   fill?: string;
//   stroke?: string;
//   strokeWidth?: number;
//   as?: ElementType;
//   className?: string;
// };

// type RoundedRectProps = RoundedRectOwnProps &
//   Omit<HTMLMotionProps<"div">, keyof RoundedRectOwnProps>;

// export const RoundedRect = forwardRef<HTMLDivElement, RoundedRectProps>(
//   (
//     {
//       children,
//       radius = 20,
//       fill = "rgba(255,255,255,0.08)",
//       stroke = "rgba(255,255,255,0.25)",
//       strokeWidth = 1,
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

//     const setRefs = (node: HTMLDivElement | null) => {
//       (containerRef as any).current = node;
//       if (typeof ref === "function") ref(node);
//       else if (ref) (ref as any).current = node;
//     };

//     useEffect(() => {
//       const container = containerRef.current;
//       const path = pathRef.current;
//       if (!container || !path) return;

//       const updatePath = () => {
//         const w = container.clientWidth;
//         const h = container.clientHeight;
//         const r = Math.min(radius, w / 2, h / 2);

//         const d = `
//           M ${w - r} 0
//           L ${r} 0
//           A ${r} ${r} 0 0 1 0 ${r}
//           L 0 ${h - r}
//           A ${r} ${r} 0 0 1 ${r} ${h}
//           L ${w - r} ${h}
//           A ${r} ${r} 0 0 1 ${w} ${h - r}
//           L ${w} ${r}
//           A ${r} ${r} 0 0 1 ${w - r} 0
//           Z
//         `;
//         path.setAttribute("d", d);
//       };

//       updatePath();

//       const observer = new ResizeObserver(() => {
//         requestAnimationFrame(updatePath);
//       });
//       observer.observe(container);

//       return () => observer.disconnect();
//     }, [radius]);

//     const MotionComponent = motion(Component as any);

//     return (
//       <MotionComponent
//         ref={setRefs}
//         className={`relative bg-transparent ${className}`}
//         style={
//           {
//             // Expose the fill as a CSS variable so Motion can animate it
//             "--shape-fill": fill,
//             ...style,
//           } as React.CSSProperties
//         }
//         onClick={onClick}
//         {...motionProps}
//       >
//         {/* The actual shape – this is the only background */}
//         <svg
//           className="pointer-events-none absolute inset-0 h-full w-full"
//           xmlns="http://www.w3.org/2000/svg"
//           fill="none"
//         >
//           <path
//             ref={pathRef}
//             // Use the CSS variable so it can be animated by Motion
//             fill="var(--shape-fill)"
//             stroke={stroke}
//             strokeWidth={strokeWidth}
//           />
//         </svg>

//         {/* Content on top */}
//         <div className="relative z-10 h-full w-full">{children}</div>
//       </MotionComponent>
//     );
//   },
// );

// RoundedRect.displayName = "RoundedRect";

// "use client";

// import {
//   forwardRef,
//   useEffect,
//   useRef,
//   type ReactNode,
//   type ElementType,
// } from "react";
// import { motion, type HTMLMotionProps } from "motion/react";

// type RoundedRectOwnProps = {
//   children: ReactNode;
//   radius?: number;
//   fill?: string;
//   stroke?: string;
//   strokeWidth?: number;
//   as?: ElementType;
//   className?: string;
// };

// type RoundedRectProps = RoundedRectOwnProps &
//   Omit<HTMLMotionProps<"div">, keyof RoundedRectOwnProps>;

// export const RoundedRect = forwardRef<HTMLDivElement, RoundedRectProps>(
//   (
//     {
//       children,
//       radius = 20,
//       fill = "rgba(255,255,255,0.08)",
//       stroke = "rgba(255,255,255,0.4)",
//       strokeWidth = 1,
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
//     const lastSize = useRef({ w: 0, h: 0 });

//     const setRefs = (node: HTMLDivElement | null) => {
//       (containerRef as any).current = node;
//       if (typeof ref === "function") ref(node);
//       else if (ref) (ref as any).current = node;
//     };

//     useEffect(() => {
//       const container = containerRef.current;
//       const path = pathRef.current;
//       if (!container || !path) return;

//       const updatePath = () => {
//         const rect = container.getBoundingClientRect();
//         const w = Math.round(rect.width * 100) / 100;
//         const h = Math.round(rect.height * 100) / 100;

//         if (
//           Math.abs(w - lastSize.current.w) < 0.5 &&
//           Math.abs(h - lastSize.current.h) < 0.5
//         ) {
//           return;
//         }
//         lastSize.current = { w, h };

//         // Extra safety padding so the stroke is never clipped
//         const pad = strokeWidth / 2 + 0.75;
//         const r = Math.max(
//           0,
//           Math.min(
//             radius,
//             (w - strokeWidth) / 2 - 0.5,
//             (h - strokeWidth) / 2 - 0.5,
//           ),
//         );

//         // Path is drawn slightly inset so the full stroke stays visible
//         const d = `
//           M ${w - r - pad} ${pad}
//           L ${r + pad} ${pad}
//           A ${r} ${r} 0 0 1 ${pad} ${r + pad}
//           L ${pad} ${h - r - pad}
//           A ${r} ${r} 0 0 1 ${r + pad} ${h - pad}
//           L ${w - r - pad} ${h - pad}
//           A ${r} ${r} 0 0 1 ${w - pad} ${h - r - pad}
//           L ${w - pad} ${r + pad}
//           A ${r} ${r} 0 0 1 ${w - r - pad} ${pad}
//           Z
//         `;

//         path.setAttribute("d", d);
//       };

//       updatePath();

//       const observer = new ResizeObserver(() => {
//         requestAnimationFrame(updatePath);
//       });
//       observer.observe(container);

//       window.visualViewport?.addEventListener("resize", updatePath);
//       window.addEventListener("resize", updatePath);

//       return () => {
//         observer.disconnect();
//         window.visualViewport?.removeEventListener("resize", updatePath);
//         window.removeEventListener("resize", updatePath);
//       };
//     }, [radius, strokeWidth]);

//     const MotionComponent = motion(Component as any);

//     return (
//       <MotionComponent
//         ref={setRefs}
//         className={`relative bg-transparent ${className}`}
//         style={
//           {
//             "--shape-fill": fill,
//             // Make sure nothing clips the stroke
//             overflow: "visible",
//             ...style,
//           } as React.CSSProperties
//         }
//         onClick={onClick}
//         {...motionProps}
//       >
//         {/*
//           Make the SVG slightly larger than the container
//           so left/right strokes have room to render
//         */}
//         <svg
//           className="pointer-events-none absolute"
//           style={{
//             top: -2,
//             left: -2,
//             width: "calc(100% + 4px)",
//             height: "calc(100% + 4px)",
//             overflow: "visible",
//           }}
//           xmlns="http://www.w3.org/2000/svg"
//           fill="none"
//         >
//           <path
//             ref={pathRef}
//             fill="var(--shape-fill)"
//             stroke={stroke}
//             strokeWidth={strokeWidth}
//             strokeLinejoin="round"
//             strokeLinecap="round"
//             vectorEffect="non-scaling-stroke"
//             shapeRendering="geometricPrecision"
//           />
//         </svg>

//         <div className="relative z-10 h-full w-full">{children}</div>
//       </MotionComponent>
//     );
//   },
// );

// RoundedRect.displayName = "RoundedRect";

// "use client";

// import {
//   forwardRef,
//   useEffect,
//   useRef,
//   useState,
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

// type RoundedRectOwnProps = {
//   children: ReactNode;
//   /** Single value or responsive object (Tailwind-style) */
//   radius?: number | ResponsiveRadius;
//   fill?: string;
//   stroke?: string;
//   strokeWidth?: number;
//   as?: ElementType;
//   className?: string;
// };

// type RoundedRectProps = RoundedRectOwnProps &
//   Omit<HTMLMotionProps<"div">, keyof RoundedRectOwnProps>;

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

//   // Find the largest breakpoint that matches current width
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

// export const RoundedRect = forwardRef<HTMLDivElement, RoundedRectProps>(
//   (
//     {
//       children,
//       radius = 20,
//       fill = "rgba(255,255,255,0.08)",
//       stroke = "rgba(255,255,255,0.4)",
//       strokeWidth = 1,
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
//     const lastSize = useRef({ w: 0, h: 0 });
//     const [currentRadius, setCurrentRadius] = useState(20);

//     const setRefs = (node: HTMLDivElement | null) => {
//       (containerRef as any).current = node;
//       if (typeof ref === "function") ref(node);
//       else if (ref) (ref as any).current = node;
//     };

//     // Resolve responsive radius on resize
//     useEffect(() => {
//       const updateRadius = () => {
//         const width = window.innerWidth;
//         setCurrentRadius(resolveRadius(radius, width));
//       };

//       updateRadius();
//       window.addEventListener("resize", updateRadius);
//       return () => window.removeEventListener("resize", updateRadius);
//     }, [radius]);

//     // Draw / update the path
//     useEffect(() => {
//       const container = containerRef.current;
//       const path = pathRef.current;
//       if (!container || !path) return;

//       const updatePath = () => {
//         const rect = container.getBoundingClientRect();
//         const w = Math.round(rect.width * 100) / 100;
//         const h = Math.round(rect.height * 100) / 100;

//         if (
//           Math.abs(w - lastSize.current.w) < 0.5 &&
//           Math.abs(h - lastSize.current.h) < 0.5
//         ) {
//           return;
//         }
//         lastSize.current = { w, h };

//         const pad = strokeWidth / 2 + 0.75;
//         const r = Math.max(
//           0,
//           Math.min(
//             currentRadius,
//             (w - strokeWidth) / 2 - 0.5,
//             (h - strokeWidth) / 2 - 0.5,
//           ),
//         );

//         const d = `
//           M ${w - r - pad} ${pad}
//           L ${r + pad} ${pad}
//           A ${r} ${r} 0 0 1 ${pad} ${r + pad}
//           L ${pad} ${h - r - pad}
//           A ${r} ${r} 0 0 1 ${r + pad} ${h - pad}
//           L ${w - r - pad} ${h - pad}
//           A ${r} ${r} 0 0 1 ${w - pad} ${h - r - pad}
//           L ${w - pad} ${r + pad}
//           A ${r} ${r} 0 0 1 ${w - r - pad} ${pad}
//           Z
//         `;

//         path.setAttribute("d", d);
//       };

//       updatePath();

//       const observer = new ResizeObserver(() => {
//         requestAnimationFrame(updatePath);
//       });
//       observer.observe(container);

//       window.visualViewport?.addEventListener("resize", updatePath);
//       window.addEventListener("resize", updatePath);

//       return () => {
//         observer.disconnect();
//         window.visualViewport?.removeEventListener("resize", updatePath);
//         window.removeEventListener("resize", updatePath);
//       };
//     }, [currentRadius, strokeWidth]);

//     const MotionComponent = motion(Component as any);

//     return (
//       <MotionComponent
//         ref={setRefs}
//         className={`relative bg-transparent ${className}`}
//         style={
//           {
//             "--shape-fill": fill,
//             overflow: "visible",
//             ...style,
//           } as React.CSSProperties
//         }
//         onClick={onClick}
//         {...motionProps}
//       >
//         <svg
//           className="pointer-events-none absolute"
//           style={{
//             top: -2,
//             left: -2,
//             width: "calc(100% + 4px)",
//             height: "calc(100% + 4px)",
//             overflow: "visible",
//           }}
//           xmlns="http://www.w3.org/2000/svg"
//           fill="none"
//         >
//           <path
//             ref={pathRef}
//             fill="var(--shape-fill)"
//             stroke={stroke}
//             strokeWidth={strokeWidth}
//             strokeLinejoin="round"
//             strokeLinecap="round"
//             vectorEffect="non-scaling-stroke"
//             shapeRendering="geometricPrecision"
//           />
//         </svg>

//         <div className="relative z-10 h-full w-full">{children}</div>
//       </MotionComponent>
//     );
//   },
// );

// RoundedRect.displayName = "RoundedRect";

// "use client";

// import {
//   forwardRef,
//   useEffect,
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

// type RoundedRectOwnProps = {
//   children: ReactNode;
//   radius?: number | ResponsiveRadius;
//   fill?: string;
//   stroke?: string;
//   strokeWidth?: number;
//   as?: ElementType;
//   className?: string;
// };

// type RoundedRectProps = RoundedRectOwnProps &
//   Omit<HTMLMotionProps<"div">, keyof RoundedRectOwnProps>;

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

// export const RoundedRect = forwardRef<HTMLDivElement, RoundedRectProps>(
//   (
//     {
//       children,
//       radius = 20,
//       fill = "rgba(255,255,255,0.08)",
//       stroke = "rgba(255,255,255,0.4)",
//       strokeWidth = 1,
//       className = "",
//       style,
//       onClick,
//       ...motionProps
//     },
//     ref,
//   ) => {
//     const containerRef = useRef<HTMLDivElement>(null);
//     const pathRef = useRef<SVGPathElement>(null);

//     const setRefs = (node: HTMLDivElement | null) => {
//       (containerRef as any).current = node;
//       if (typeof ref === "function") ref(node);
//       else if (ref) (ref as any).current = node;
//     };

//     useEffect(() => {
//       const container = containerRef.current;
//       const path = pathRef.current;
//       if (!container || !path) return;

//       const updatePath = () => {
//         const w = container.clientWidth;
//         const h = container.clientHeight;

//         if (w <= 0 || h <= 0) return;

//         // Resolve radius at the moment of drawing (no React state)
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
//       };

//       // Initial draw
//       updatePath();

//       const observer = new ResizeObserver(() => {
//         requestAnimationFrame(updatePath);
//       });

//       observer.observe(container);

//       // Also update when crossing breakpoints
//       window.addEventListener("resize", updatePath);

//       return () => {
//         observer.disconnect();
//         window.removeEventListener("resize", updatePath);
//       };
//     }, [radius, strokeWidth]);

//     return (
//       <motion.div
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
//           <path
//             ref={pathRef}
//             fill="var(--shape-fill)"
//             stroke={stroke}
//             strokeWidth={strokeWidth}
//             strokeLinejoin="round"
//             strokeLinecap="round"
//             vectorEffect="non-scaling-stroke"
//           />
//         </svg>

//         <div className="relative z-10 h-full w-full">{children}</div>
//       </motion.div>
//     );
//   },
// );

// RoundedRect.displayName = "RoundedRect";

"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type ReactNode,
  type ElementType,
} from "react";
import { motion, type HTMLMotionProps } from "motion/react";

type ResponsiveRadius = {
  base?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  "2xl"?: number;
};

type RoundedRectOwnProps = {
  children: ReactNode;
  radius?: number | ResponsiveRadius;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  /** Noise opacity applied only inside the shape (0 = disabled) */
  noiseOpacity?: number;
  as?: ElementType;
  className?: string;
};

type RoundedRectProps = RoundedRectOwnProps &
  Omit<HTMLMotionProps<"div">, keyof RoundedRectOwnProps>;

const breakpoints = {
  base: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

function resolveRadius(
  radius: number | ResponsiveRadius | undefined,
  width: number,
): number {
  if (typeof radius === "number") return radius;
  if (!radius) return 20;

  const sorted = (
    Object.entries(breakpoints) as [keyof typeof breakpoints, number][]
  ).sort((a, b) => b[1] - a[1]);

  for (const [key, minWidth] of sorted) {
    if (width >= minWidth && radius[key] !== undefined) {
      return radius[key]!;
    }
  }

  return radius.base ?? 20;
}

function createNoiseDataUrl() {
  const svg = `<svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
    <filter id="n">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch"/>
    </filter>
    <rect width="100%" height="100%" filter="url(#n)"/>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const RoundedRect = forwardRef<HTMLDivElement, RoundedRectProps>(
  (
    {
      children,
      radius = 20,
      fill = "rgba(255,255,255,0.08)",
      stroke = "rgba(255,255,255,0.4)",
      strokeWidth = 1,
      noiseOpacity = 0,
      as: Component = "div",
      className = "",
      style,
      onClick,
      ...motionProps
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const pathRef = useRef<SVGPathElement>(null);
    const clipPathRef = useRef<SVGPathElement>(null);
    const uid = useId().replace(/:/g, "");

    const setRefs = (node: HTMLDivElement | null) => {
      (containerRef as any).current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as any).current = node;
    };

    useEffect(() => {
      const container = containerRef.current;
      const path = pathRef.current;
      const clipPath = clipPathRef.current;
      if (!container || !path) return;

      const updatePath = () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (w <= 0 || h <= 0) return;

        const currentRadius = resolveRadius(radius, window.innerWidth);
        const pad = strokeWidth / 2 + 0.5;

        const r = Math.max(
          0,
          Math.min(
            currentRadius,
            (w - strokeWidth) / 2 - 1,
            (h - strokeWidth) / 2 - 1,
          ),
        );

        const d = [
          `M ${w - r - pad} ${pad}`,
          `L ${r + pad} ${pad}`,
          `A ${r} ${r} 0 0 1 ${pad} ${r + pad}`,
          `L ${pad} ${h - r - pad}`,
          `A ${r} ${r} 0 0 1 ${r + pad} ${h - pad}`,
          `L ${w - r - pad} ${h - pad}`,
          `A ${r} ${r} 0 0 1 ${w - pad} ${h - r - pad}`,
          `L ${w - pad} ${r + pad}`,
          `A ${r} ${r} 0 0 1 ${w - r - pad} ${pad}`,
          `Z`,
        ].join(" ");

        path.setAttribute("d", d);
        if (clipPath) clipPath.setAttribute("d", d);
      };

      updatePath();

      const observer = new ResizeObserver(() => {
        requestAnimationFrame(updatePath);
      });

      observer.observe(container);
      window.addEventListener("resize", updatePath);

      return () => {
        observer.disconnect();
        window.removeEventListener("resize", updatePath);
      };
    }, [radius, strokeWidth]);

    const MotionComponent = motion(Component as any);
    const noiseId = `noise-${uid}`;
    const clipId = `clip-${uid}`;

    return (
      <MotionComponent
        ref={setRefs}
        className={`relative bg-transparent ${className}`}
        style={
          {
            backgroundColor: "transparent",
            background: "transparent",
            "--shape-fill": fill,
            ...style,
          } as React.CSSProperties
        }
        onClick={onClick}
        {...motionProps}
      >
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          overflow="visible"
        >
          <defs>
            <clipPath id={clipId}>
              <path ref={clipPathRef} />
            </clipPath>

            {noiseOpacity > 0 && (
              <pattern
                id={noiseId}
                patternUnits="userSpaceOnUse"
                width="180"
                height="180"
              >
                <image
                  href={createNoiseDataUrl()}
                  width="180"
                  height="180"
                  preserveAspectRatio="none"
                />
              </pattern>
            )}
          </defs>

          {/* Main shape */}
          <path
            ref={pathRef}
            fill="var(--shape-fill)"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />

          {/* Noise (strictly clipped to the shape) */}
          {noiseOpacity > 0 && (
            <rect
              width="100%"
              height="100%"
              fill={`url(#${noiseId})`}
              clipPath={`url(#${clipId})`}
              opacity={noiseOpacity}
              style={{ mixBlendMode: "overlay" }}
            />
          )}
        </svg>

        <div className="relative z-10 h-full w-full">{children}</div>
      </MotionComponent>
    );
  },
);

RoundedRect.displayName = "RoundedRect";
