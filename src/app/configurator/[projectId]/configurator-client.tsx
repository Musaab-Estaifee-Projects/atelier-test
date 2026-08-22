// src/app/configurator/[projectId]/ConfiguratorClient.tsx
"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { suppressStreamPixelConsoleNoise } from "@/lib/stream-pixel/suppress-sdk-noise";

/**
 * StreamPixel is browser-only (WebRTC + DOM).
 * dynamic(..., { ssr: false }) prevents server render of the SDK.
 */
const ConfiguratorShell = dynamic(
  () => import("@/components/configurator/configurator-shell"),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 flex items-center justify-center bg-[#18181A] text-white/70">
        Loading configurator…
      </div>
    ),
  },
);

export default function ConfiguratorClient({
  projectId,
}: {
  projectId: string;
}) {
  useEffect(() => suppressStreamPixelConsoleNoise(), []);

  return <ConfiguratorShell projectId={projectId} />;
}
