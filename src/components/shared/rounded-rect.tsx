/* eslint-disable @typescript-eslint/no-explicit-any */
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- `as` must not be forwarded to motion.div
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

    const noiseId = `noise-${uid}`;
    const clipId = `clip-${uid}`;

    return (
      <motion.div
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

        <div className="relative z-10 h-full w-full text-center! self-center">
          {children}
        </div>
      </motion.div>
    );
  },
);

RoundedRect.displayName = "RoundedRect";
