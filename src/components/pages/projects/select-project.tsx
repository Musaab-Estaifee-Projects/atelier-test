"use client";

import { useState } from "react";
import Link from "next/link";
import AtelierMark from "@/components/icons/atelier-mark";
import ReturnConfiguration from "@/components/pages/projects/return-configuration";
import { Button } from "@/components/ui/button";
import { CATALOG_PROJECTS, type CatalogProject } from "@/lib/projects/catalog";
import { pageNoiseStyle } from "@/lib/ui/page-noise";

function ProjectCard({ project }: { project: CatalogProject }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group flex h-full w-full min-h-0 flex-col gap-3.5 border border-transparent p-2.5 transition-colors duration-500 hover:border-white/10 hover:bg-white/5"
    >
      <div className="relative aspect-[467/390] w-full min-h-0 overflow-hidden lg:aspect-auto lg:min-h-[140px] lg:flex-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={project.image}
          alt={project.name}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex w-full shrink-0 flex-col gap-[7px]">
        <h2 className="font-libre-baskerville text-[clamp(20px,2vw,26px)] leading-none font-normal tracking-[0.15em] text-white uppercase">
          {project.name}
        </h2>
        <div className="h-px w-full bg-white/35" />
        <div className="flex w-full items-start gap-2.5 text-white">
          <div className="flex min-w-0 flex-1 flex-col gap-[7px]">
            <p className="text-[11px] tracking-[0.06em] text-white/60 uppercase">
              Handover
            </p>
            <p className="text-[12px] leading-none">{project.handover}</p>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-[7px]">
            <p className="text-[11px] tracking-[0.06em] text-white/60 uppercase">
              Number of Residences
            </p>
            <p className="text-[12px] leading-none">{project.residences}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function SelectProject({
  initialReturn = false,
}: {
  initialReturn?: boolean;
}) {
  const [returnOpen, setReturnOpen] = useState(initialReturn);

  return (
    <main
      className="relative min-h-dvh bg-[#00272d] text-white lg:h-dvh lg:overflow-hidden"
      style={{
        ...pageNoiseStyle(0.12),
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/projects/bg.png"
          alt=""
          className="h-full w-full object-cover"
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh w-full flex-col items-center px-5 pt-6 pb-6 sm:px-8 sm:pt-8 sm:pb-8 lg:h-dvh lg:px-10 lg:pt-6 lg:pb-8">
        <header className="flex shrink-0 flex-col items-center">
          <AtelierMark href="/" />
          <h1 className="mt-8 font-libre-baskerville text-[clamp(22px,2.2vw,27.4px)] leading-[1.16] font-normal tracking-[0.05em] text-white uppercase sm:mt-10">
            Select A Project
          </h1>
        </header>

        <ul className="mt-8 grid w-full grid-cols-1 justify-items-center gap-8 md:mt-10 md:grid-cols-2 md:gap-6 lg:mt-8 lg:min-h-0 lg:flex-1 lg:grid-cols-3 lg:grid-rows-1 lg:items-stretch lg:gap-5">
          {CATALOG_PROJECTS.map((project) => (
            <li
              key={project.slug}
              className="w-full max-w-[345px] min-h-0 md:max-w-none md:last:col-span-2 md:last:max-w-[345px] lg:h-full lg:max-w-none lg:last:col-span-1 lg:last:max-w-none"
            >
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>

        <div className="mt-12! flex shrink-0 flex-col items-center lg:mt-8">
          <p className="text-center text-[12px] leading-[1.2] text-white underline decoration-white/54">
            Already configured your apartment?
          </p>
          <Button
            type="button"
            variant="pill-soft"
            size="pill-lg"
            className="mt-4 w-full"
            onClick={() => setReturnOpen(true)}
          >
            Return to your configuration
          </Button>
        </div>
      </div>

      <ReturnConfiguration
        open={returnOpen}
        onClose={() => setReturnOpen(false)}
      />
    </main>
  );
}
