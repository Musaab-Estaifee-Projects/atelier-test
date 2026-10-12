import { Button } from "@/components/ui/button";
import ProjectCard from "./project-card";
import { TProject } from "@/types/types";

type ProjectsGridProps = {
  projects: TProject[];
  errorMessage: string | null;
};

const ProjectsGrid = ({ projects, errorMessage }: ProjectsGridProps) => {
  if (errorMessage) {
    return (
      <div className="mt-8 flex w-full flex-col items-center gap-4 py-16">
        <p className="text-center text-sm text-white/70">{errorMessage}</p>
        <form>
          <Button type="submit" variant="pill" size="pill">
            Retry
          </Button>
        </form>
      </div>
    );
  }

  if (!projects?.length) {
    return (
      <p className="mt-8 w-full py-16 text-center text-sm text-white/70">
        No projects available yet.
      </p>
    );
  }

  return (
    <ul className="mt-8 grid w-full justify-items-center md:mt-10 grid-cols-2 lg:mt-8 lg:min-h-0 lg:flex-1 lg:grid-cols-3 lg:grid-rows-1 lg:items-stretch gap-3 md:gap-0">
      {projects.map((project) => (
        <li
          key={project.id}
          className="w-full min-h-0 md:max-w-none lg:h-full lg:max-w-none"
        >
          <ProjectCard project={project} />
        </li>
      ))}
    </ul>
  );
};

export default ProjectsGrid;
