import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SelectApartment from "@/components/pages/projects/select-apartment";
import { CATALOG_PROJECTS, getProject } from "@/lib/projects/catalog";

export function generateStaticParams() {
  return CATALOG_PROJECTS.map((project) => ({ slug: project.slug }));
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  return {
    title: project ? `ATELIER · ${project.name}` : "ATELIER · Select apartment",
    description: "Select your residence type and layout to start configuring.",
  };
}

const ProjectApartmentPage = async ({ params }: PageProps) => {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  return <SelectApartment project={project} />;
};

export default ProjectApartmentPage;
