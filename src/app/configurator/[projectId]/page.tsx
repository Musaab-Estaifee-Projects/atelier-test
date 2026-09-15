import type { Metadata, Viewport } from "next";
import ConfiguratorClient from "./configurator-client";

export const metadata: Metadata = {
  title: "ATELIER · Configurator",
  description: "Customize your apartment finishes in real time.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

type PageProps = {
  params: Promise<{ projectId: string }>;
};

const ConfiguratorPage = async ({ params }: PageProps) => {
  const { projectId } = await params;
  return <ConfiguratorClient projectId={projectId} />;
};

export default ConfiguratorPage;
