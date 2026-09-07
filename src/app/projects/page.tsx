// import type { Metadata } from "next";
// import AtelierMark from "@/components/icons/atelier-mark";
// import Bg from "@/components/shared/bg";
// import ProjectsGrid from "@/components/pages/projects/projects-grid";
// import { pageNoiseStyle } from "@/lib/ui/page-noise";
// import ReturnConfigurationCta from "@/components/pages/projects/return-configuration-cta";

// export const metadata: Metadata = {
//   title: "ATELIER · Select a project",
//   description: "Choose a REEF residence to begin configuring your apartment.",
// };

// export default function ProjectsPage() {
//   return (
//     <main
//       className="relative min-h-dvh bg-[#00272d] text-white lg:h-dvh lg:overflow-hidden"
//       style={{
//         ...pageNoiseStyle(0.11),
//       }}
//     >
//       <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
//         <Bg
//           preserveAspectRatio="xMidYMid slice"
//           className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 object-cover"
//         />
//       </div>

//       <div className="relative z-10 mx-auto flex min-h-dvh w-full flex-col items-center px-5 pt-6 pb-6 sm:px-8 sm:pt-8 sm:pb-8 lg:h-dvh lg:px-10 lg:pt-6 lg:pb-8">
//         <header className="flex shrink-0 flex-col items-center">
//           <AtelierMark href="/" />
//           <h1 className="mt-8 font-baskerville text-[clamp(22px,2.2vw,27.4px)] leading-[1.16] font-normal tracking-wider text-white uppercase sm:mt-10">
//             Select A Project
//           </h1>
//         </header>

//         <ProjectsGrid />

//         <ReturnConfigurationCta />
//       </div>
//     </main>
//   );
// }

import type { Metadata } from "next";
import AtelierMark from "@/components/icons/atelier-mark";
import Bg from "@/components/shared/bg";
import ProjectsGrid from "@/components/pages/projects/projects-grid";
import { pageNoiseStyle } from "@/lib/ui/page-noise";
import ReturnConfigurationCta from "@/components/pages/projects/return-configuration-cta";
import { getAllProjects } from "@/services/get-all-projects.service";
import { Suspense } from "react";
import ProjectsGridSkeleton from "@/components/pages/projects/skeletons/projects-grid-skeleton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ATELIER · Select a project",
  description: "Choose a REEF residence to begin configuring your apartment.",
};

const page = async () => {
  let projects: Awaited<ReturnType<typeof getAllProjects>> = [];
  let errorMessage: string | null = null;

  try {
    projects = await getAllProjects();
  } catch (err) {
    errorMessage =
      err instanceof Error
        ? err.message
        : "Failed to load projects. Please try again.";
  }

  return (
    <main
      className="relative min-h-dvh bg-[#00272d] text-white lg:h-dvh lg:overflow-hidden"
      style={{
        ...pageNoiseStyle(0.11),
      }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
        <Bg
          preserveAspectRatio="xMidYMid slice"
          className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 object-cover"
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh w-full flex-col items-center px-5 pt-6 pb-6 sm:px-8 sm:pt-8 sm:pb-8 lg:h-dvh lg:px-10 lg:pt-6 lg:pb-8">
        <header className="flex shrink-0 flex-col items-center">
          <AtelierMark href="/" />
          <h1 className="mt-8 font-baskerville text-[clamp(22px,2.2vw,27.4px)] leading-[1.16] font-normal tracking-wider text-white uppercase sm:mt-10">
            Select A Project
          </h1>
        </header>

        <Suspense fallback={<ProjectsGridSkeleton />}>
          <ProjectsGrid projects={projects} errorMessage={errorMessage} />
        </Suspense>

        <ReturnConfigurationCta />
      </div>
    </main>
  );
};

export default page;
