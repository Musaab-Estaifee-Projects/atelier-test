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

const ConfiguratorPage = async ({ params }: PageProps) => {
  const { projectId } = await params;
  return <ConfiguratorClient projectId={projectId} />;
};

export default ConfiguratorPage;
