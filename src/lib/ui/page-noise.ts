import type { CSSProperties } from "react";

const cache = new Map<string, CSSProperties>();

type NoiseOptions = {
  /** SVG feTurbulence octaves — lower is cheaper to paint (default 4). */
  octaves?: number;
  size?: number;
};

/**
 * Tiled fractal-noise background. Results are cached per opacity/options so
 * callers can use it in render without rebuilding data-URLs every time.
 */
export function pageNoiseStyle(
  opacity = 0.12,
  options: NoiseOptions = {},
): CSSProperties {
  const octaves = options.octaves ?? 4;
  const size = options.size ?? 180;
  const key = `${opacity}|${octaves}|${size}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const encoded = encodeURIComponent(
    `<svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="${octaves}" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#noise)" opacity="${opacity}"/></svg>`,
  );
  const style: CSSProperties = {
    backgroundImage: `url("data:image/svg+xml,${encoded}")`,
    backgroundRepeat: "repeat",
    backgroundSize: `${size}px ${size}px`,
  };
  cache.set(key, style);
  return style;
}
