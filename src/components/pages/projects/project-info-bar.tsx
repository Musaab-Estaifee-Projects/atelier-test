import { TProject } from "@/types/types";

const ProjectInfoBar = ({ project }: { project: TProject }) => {
  return (
    <div className="flex w-full flex-col gap-1.75 bg-white/10 p-4.75 backdrop-blur-md">
      <h2 className="font-baskerville text-[26px] leading-none font-normal tracking-[0.15em] text-white uppercase">
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
          <p className="text-[12px] leading-none">{project.apartments_count}</p>
        </div>
      </div>
    </div>
  );
};

export default ProjectInfoBar;
