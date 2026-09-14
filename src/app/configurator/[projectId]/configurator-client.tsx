"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { suppressStreamPixelConsoleNoise } from "@/lib/stream-pixel/suppress-sdk-noise";
import { ConfiguratorBootOverlay } from "@/components/configurator/loading-overlay";
import { currentResidenceSubtitle } from "@/lib/configurator/residence-label";

/**
 * StreamPixel is browser-only (WebRTC + DOM).
 * dynamic(..., { ssr: false }) prevents server render of the SDK.
 */
const ConfiguratorShell = dynamic(
  () => import("@/components/configurator/configurator-shell"),
  {
    ssr: false,
    loading: () => (
      <ConfiguratorBootOverlay unitSubtitle={currentResidenceSubtitle()} />
    ),
  },
);

const ConfiguratorClient = ({ projectId }: { projectId: string }) => {
  useEffect(() => {
    const restoreConsole = suppressStreamPixelConsoleNoise();
    return restoreConsole;
  }, []);

  return <ConfiguratorShell projectId={projectId} />;
};

export default ConfiguratorClient;
