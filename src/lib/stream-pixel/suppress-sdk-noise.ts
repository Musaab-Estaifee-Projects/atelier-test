/**
 * StreamPixel bundles Mixpanel; ad blockers / CORS often yield
 * `Mixpanel error: "Bad HTTP status: 0 "` which Next overlays as a console error.
 * Analytics failure is non-fatal — keep the overlay quiet in the configurator.
 */
export function suppressStreamPixelConsoleNoise(): () => void {
  if (typeof window === "undefined") return () => {};

  const originalError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    const text = args.map((a) => (typeof a === "string" ? a : "")).join(" ");
    if (
      text.includes("Mixpanel error") ||
      text.includes("Bad HTTP status: 0")
    ) {
      return;
    }
    originalError(...args);
  };

  return () => {
    console.error = originalError;
  };
}
