function isSdkTelemetryNoise(text: string): boolean {
  return (
    text.includes("Mixpanel error") ||
    text.includes("Bad HTTP status: 0") ||
    text.includes("mixapi.streampixel.io")
  );
}

/**
 * StreamPixel bundles Mixpanel; ad blockers / CORS often yield
 * `Mixpanel error: "Bad HTTP status: 0 "` which Next overlays as a console error.
 * Analytics failure is non-fatal — keep the overlay quiet in the configurator.
 */
export function suppressStreamPixelConsoleNoise(): () => void {
  if (typeof window === "undefined") return () => {};

  const originalError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    const text = args
      .map((a) => (typeof a === "string" ? a : a instanceof Error ? a.message : ""))
      .join(" ");
    if (isSdkTelemetryNoise(text)) return;
    originalError(...args);
  };

  const onWindowError = (event: ErrorEvent) => {
    const fromSdk = String(event.filename ?? "").includes("streampixel");
    if (
      fromSdk &&
      event.message.includes("Cannot read properties of null (reading 'style')")
    ) {
      event.preventDefault();
    }
  };
  window.addEventListener("error", onWindowError);

  return () => {
    console.error = originalError;
    window.removeEventListener("error", onWindowError);
  };
}
