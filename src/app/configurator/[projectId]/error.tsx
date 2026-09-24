"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingOverlay from "@/components/configurator/loading-overlay";

export default function ConfiguratorError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("[configurator] segment error", error.digest ?? error.message);
  }, [error]);

  return (
    <LoadingOverlay
      layout="fixed"
      kind="error"
      progress={0}
      unitSubtitle="Your residence"
      endedMessage="Something went wrong while opening the configurator. Please try again, or go back and choose another apartment."
      onReconnect={retry}
      onBackHome={() => router.push("/projects")}
    />
  );
}
