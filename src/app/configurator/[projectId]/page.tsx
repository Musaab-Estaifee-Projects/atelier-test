// src/app/configurator/[projectId]/page.tsx

import type { Metadata } from "next";
import ConfiguratorClient from "./configurator-client";

export const metadata: Metadata = {
  title: "ATELIER · Configurator",
  description: "Customize your apartment finishes in real time.",
  robots: { index: false, follow: false }, // configurator sessions are private by design
};

type PageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ConfiguratorPage({ params }: PageProps) {
  const { projectId } = await params;
  return <ConfiguratorClient projectId={projectId} />;
}
