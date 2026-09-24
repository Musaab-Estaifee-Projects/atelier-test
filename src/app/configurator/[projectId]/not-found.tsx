"use client";

import { useRouter } from "next/navigation";
import LoadingOverlay from "@/components/configurator/loading-overlay";

export default function ConfiguratorNotFound() {
  const router = useRouter();
  return (
    <LoadingOverlay
      layout="fixed"
      kind="error"
      progress={0}
      unitSubtitle="Your residence"
      endedTitle="This residence could not be found"
      endedMessage="Go back and choose another apartment to start customizing."
      onBackHome={() => router.push("/projects")}
    />
  );
}
