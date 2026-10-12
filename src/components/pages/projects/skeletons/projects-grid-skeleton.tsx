const ProjectCardSkeleton = () => {
  return (
    <div
      className="flex h-full w-full min-h-0 flex-col bg-[#001F24] md:gap-3.5 md:border md:border-transparent md:bg-transparent md:p-2.5"
      aria-hidden
    >
      <div className="relative aspect-[245.45/212.01] w-full min-h-0 overflow-hidden lg:aspect-auto lg:min-h-35 lg:flex-1">
        <div className="absolute inset-0 animate-pulse bg-white/10" />
      </div>

      <div className="flex w-full shrink-0 flex-col gap-[0.22825rem] p-[0.56881rem] md:gap-1.75 md:p-0">
        <div className="h-[1.01119rem] w-3/4 max-w-40 animate-pulse rounded-sm bg-white/15 md:h-[clamp(20px,2vw,26px)] md:max-w-48" />

        <div className="h-px w-full bg-white/10 md:bg-white/35" />

        <div className="flex w-full flex-col items-start gap-[0.50556rem] md:flex-row md:gap-2.5">
          <div className="flex min-w-0 flex-1 flex-col gap-[0.316rem] md:gap-1.75">
            <div className="h-[0.44238rem] w-12 animate-pulse rounded-sm bg-white/10 md:h-[11px] md:w-16" />
            <div className="h-[0.50556rem] w-16 animate-pulse rounded-sm bg-white/15 md:h-3 md:w-20" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-[0.316rem] md:gap-1.75">
            <div className="h-[0.44238rem] w-24 animate-pulse rounded-sm bg-white/10 md:h-[11px] md:w-28" />
            <div className="h-[0.50556rem] w-14 animate-pulse rounded-sm bg-white/15 md:h-3 md:w-16" />
          </div>
        </div>
      </div>
    </div>
  );
};

const ProjectsGridSkeleton = () => {
  return (
    <ul
      className="mt-8 grid w-full grid-cols-2 justify-items-center gap-3 md:mt-10 md:gap-0 lg:mt-8 lg:min-h-0 lg:flex-1 lg:grid-cols-3 lg:grid-rows-1 lg:items-stretch"
      aria-busy="true"
      aria-label="Loading projects"
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <li
          key={i}
          className="w-full min-h-0 md:max-w-none lg:h-full lg:max-w-none"
        >
          <ProjectCardSkeleton />
        </li>
      ))}
    </ul>
  );
};

export default ProjectsGridSkeleton;
