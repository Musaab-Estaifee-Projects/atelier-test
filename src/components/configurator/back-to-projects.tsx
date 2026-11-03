"use client";

import { LucideLogOut } from "lucide-react";
import { Button } from "../ui/button";

type Props = {
  onPrepareLeave: () => void;
};

const BackToProjects = ({ onPrepareLeave }: Props) => {
  return (
    <Button
      type="button"
      variant="pill"
      onClick={onPrepareLeave}
      data-cfg-chrome
      data-transition-href="/projects"
      // className="pointer-events-auto absolute left-3 top-[max(10px,env(safe-area-inset-top))] z-26 leading-4 h-9 rounded-full border-transparent bg-[#00272d] px-3.25 text-[10px] tracking-[0.3px] hover:bg-[#003840] *:text-white uppercase cursor-pointer"
      className="pointer-events-auto absolute left-3 top-[max(10px,env(safe-area-inset-top))] z-26 leading-4 h-9 rounded-full border-white/10! bg-[#F2E9D8] px-3.25 text-[10px] tracking-[0.3px] hover:bg-[#003840] hover:*:text-white! *:text-[#00272D] uppercase cursor-pointer"
    >
      <LucideLogOut className="size-4 rotate-180" />
      <span className="">Exit</span>
    </Button>
  );
};

export default BackToProjects;
