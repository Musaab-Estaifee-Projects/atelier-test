import type { Metadata } from "next";
import SelectProject from "@/components/pages/projects/select-project";

export const metadata: Metadata = {
  title: "ATELIER · Select a project",
  description: "Choose a REEF residence to begin configuring your apartment.",
};

const ProjectsPage = () => {
  return <SelectProject />;
};

export default ProjectsPage;
