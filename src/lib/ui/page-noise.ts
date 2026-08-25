import type { CSSProperties } from "react";

export function pageNoiseStyle(opacity = 0.12): CSSProperties {
  const encoded = encodeURIComponent(
    `<svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#noise)" opacity="${opacity}"/></svg>`,
  );
  return {
    backgroundImage: `url("data:image/svg+xml,${encoded}")`,
    backgroundRepeat: "repeat",
    backgroundSize: "180px 180px",
  };
}
