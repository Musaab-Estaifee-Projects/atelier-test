// "use client";

// import { useGetAllProjects } from "@/services/get-all-projects.service";
// import ProjectsGridSkeleton from "./skeletons/projects-grid-skeleton";
// import { Button } from "@/components/ui/button";
// import ProjectCard from "./project-card";

// const ProjectsGrid = () => {
//   const {
//     data: projects,
//     isPending,
//     isError,
//     error,
//     refetch,
//     isFetching,
//   } = useGetAllProjects();

//   if (isPending) {
//     return <ProjectsGridSkeleton />;
//   }

//   if (isError) {
//     return (
//       <div className="mt-8 flex w-full flex-col items-center gap-4 py-16">
//         <p className="text-center text-sm text-white/70">
//           {error instanceof Error
//             ? error.message
//             : "Failed to load projects. Please try again."}
//         </p>
//         <Button
//           type="button"
//           variant="pill"
//           size="pill"
//           onClick={() => void refetch()}
//           disabled={isFetching}
//         >
//           {isFetching ? "Retrying…" : "Retry"}
//         </Button>
//       </div>
//     );
//   }

//   if (!projects?.length) {
//     return (
//       <p className="mt-8 w-full py-16 text-center text-sm text-white/70">
//         No projects available yet.
//       </p>
//     );
//   }

//   return (
//     <ul className="mt-8 grid w-full grid-cols-1 justify-items-center md:mt-10 md:grid-cols-2 lg:mt-8 lg:min-h-0 lg:flex-1 lg:grid-cols-3 lg:grid-rows-1 lg:items-stretch">
//       {projects.map((project) => (
//         <li
//           key={project.code}
//           className="w-full max-w-86.25 min-h-0 md:max-w-none md:last:col-span-2 md:last:max-w-86.25 lg:h-full lg:max-w-none lg:last:col-span-1 lg:last:max-w-none"
//         >
//           <ProjectCard project={project} />
//         </li>
//       ))}
//     </ul>
//   );
// };

// export default ProjectsGrid;

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
    <ul className="mt-8 grid w-full grid-cols-1 justify-items-center md:mt-10 md:grid-cols-2 lg:mt-8 lg:min-h-0 lg:flex-1 lg:grid-cols-3 lg:grid-rows-1 lg:items-stretch">
      {projects.map((project) => (
        <li
          key={project.id}
          className="w-full max-w-86.25 min-h-0 md:max-w-none md:last:col-span-2 md:last:max-w-86.25 lg:h-full lg:max-w-none lg:last:col-span-1 lg:last:max-w-none"
        >
          <ProjectCard project={project} />
        </li>
      ))}
    </ul>
  );
};

export default ProjectsGrid;
