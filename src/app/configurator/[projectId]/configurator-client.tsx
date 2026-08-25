"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { suppressStreamPixelConsoleNoise } from "@/lib/stream-pixel/suppress-sdk-noise";
import { ConfiguratorBootOverlay } from "@/components/configurator/loading-overlay";
import { reviewUnitSubtitle } from "@/lib/configurator/review-selections";

function bootSubtitle(): string {
  if (typeof window === "undefined") return "Your residence";
  const query = new URLSearchParams(window.location.search);
  return reviewUnitSubtitle(query.get("unit"), query.get("level"));
}

/**
 * StreamPixel is browser-only (WebRTC + DOM).
 * dynamic(..., { ssr: false }) prevents server render of the SDK.
 */
const ConfiguratorShell = dynamic(
  () => import("@/components/configurator/configurator-shell"),
  {
    ssr: false,
    loading: () => <ConfiguratorBootOverlay unitSubtitle={bootSubtitle()} />,
  },
);

const ConfiguratorClient = ({ projectId }: { projectId: string }) => {
  useEffect(() => suppressStreamPixelConsoleNoise(), []);

  return <ConfiguratorShell projectId={projectId} />;
};

export default ConfiguratorClient;
