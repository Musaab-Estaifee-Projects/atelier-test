const ProjectCardSkeleton = () => {
  return (
    <div
      className="flex h-full w-full min-h-0 flex-col gap-3.5 border border-transparent p-2.5"
      aria-hidden
    >
      <div className="relative aspect-467/390 w-full min-h-0 overflow-hidden bg-white/10 lg:aspect-auto lg:min-h-35 lg:flex-1">
        <div className="absolute inset-0 animate-pulse bg-white/10" />
      </div>

      <div className="flex w-full shrink-0 flex-col gap-1.75">
        <div className="h-[clamp(20px,2vw,26px)] w-3/4 max-w-48 animate-pulse rounded-sm bg-white/15" />
        <div className="h-px w-full bg-white/35" />
        <div className="flex w-full items-start gap-2.5">
          <div className="flex min-w-0 flex-1 flex-col gap-1.75">
            <div className="h-2.75 w-16 animate-pulse rounded-sm bg-white/10" />
            <div className="h-3 w-20 animate-pulse rounded-sm bg-white/15" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.75">
            <div className="h-2.75 w-28 animate-pulse rounded-sm bg-white/10" />
            <div className="h-3 w-12 animate-pulse rounded-sm bg-white/15" />
          </div>
        </div>
      </div>
    </div>
  );
};

const ProjectsGridSkeleton = () => {
  return (
    <ul
      className="mt-8 grid w-full grid-cols-1 justify-items-center md:mt-10 md:grid-cols-2 lg:mt-8 lg:min-h-0 lg:flex-1 lg:grid-cols-3 lg:grid-rows-1 lg:items-stretch"
      aria-busy="true"
      aria-label="Loading projects"
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <li
          key={i}
          className="w-full max-w-86.25 min-h-0 md:max-w-none md:last:col-span-2 md:last:max-w-86.25 lg:h-full lg:max-w-none lg:last:col-span-1 lg:last:max-w-none"
        >
          <ProjectCardSkeleton />
        </li>
      ))}
    </ul>
  );
};

export default ProjectsGridSkeleton;
