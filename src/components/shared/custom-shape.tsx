/* eslint-disable @typescript-eslint/no-explicit-any */

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

  radius?: ResponsiveValue<number>;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
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

function buildPath(w: number, h: number, r: number): string {
  const maxR = Math.min(w, h) * 0.5 - 0.5;
  const R = Math.max(0, Math.min(r, maxR));

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
    const clipPathRef = useRef<SVGPathElement>(null);
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
      const clipPath = clipPathRef.current;
      if (!el || !path) return;

      let rafId = 0;

      const paint = () => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        if (w < 1 || h < 1) return;

        const r = resolve(radius, 26, window.innerWidth);
        const d = buildPath(w, h, r);

        path.setAttribute("d", d);
        if (clipPath) clipPath.setAttribute("d", d);
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
    const clipId = `clip-${uid}`;
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
          <defs>
            {useGradient && (
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop stopColor="#00272D" stopOpacity="0.98" />
                <stop offset="1" stopColor="#003E47" stopOpacity="0.98" />
              </linearGradient>
            )}

            <clipPath id={clipId}>
              <path ref={clipPathRef} />
            </clipPath>
          </defs>

          <path
            ref={pathRef}
            fill={useGradient ? `url(#${gradientId})` : fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <div
          className="relative z-10 flex size-full flex-col"
          style={{ clipPath: `url(#${clipId})` }}
        >
          {children}
        </div>
      </Component>
    );
  },
);

CustomShape.displayName = "CustomShape";
