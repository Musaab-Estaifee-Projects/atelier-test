import { TProject } from "@/types/types";
import Image from "next/image";
import Link from "next/link";

const ProjectCard = ({ project }: { project: TProject }) => {
  return (
    <Link
      href={`/projects/${project.code}`}
      className="group flex h-full w-full min-h-0 flex-col gap-3.5 border border-transparent p-2.5 transition-colors duration-500 hover:border-white/10 hover:bg-white/5"
    >
      {/* <div className="relative aspect-467/390 w-full min-h-0 overflow-hidden lg:aspect-auto lg:min-h-35 lg:flex-1">
        <img
          src={project.image}
          alt={project.name}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div> */}

      <div className="relative aspect-467/390 w-full min-h-0 overflow-hidden lg:aspect-auto lg:min-h-35 lg:flex-1">
        <Image
          src={project.image}
          alt={project.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={false}
        />
      </div>

      <div className="flex w-full shrink-0 flex-col gap-1.75">
        <h2 className="font-baskerville text-[clamp(20px,2vw,26px)] leading-none font-normal tracking-[0.15em] text-white uppercase">
          {project.name}
        </h2>

        <div className="h-px w-full bg-white/35" />

        <div className="flex w-full items-start gap-2.5 text-white">
          <div className="flex min-w-0 flex-1 flex-col gap-1.75">
            <p className="text-[11px] tracking-[0.06em] text-white/60 uppercase">
              Handover
            </p>
            <p className="text-[12px] leading-none">{project.handover}</p>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1.75">
            <p className="text-[11px] tracking-[0.06em] text-white/60 uppercase">
              Number of Residences
            </p>

            <p className="text-[12px] leading-none">
              {project.apartments_count}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard;
