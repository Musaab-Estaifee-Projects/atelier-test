"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AtelierMark from "@/components/icons/atelier-mark";
import ApartmentForm, {
  type ApartmentChoice,
} from "@/components/pages/projects/apartment-form";
import { getDesign } from "@/lib/configurator/api";
import {
  configuratorHref,
  stylesHref,
  type CatalogProject,
} from "@/lib/projects/catalog";
import { pageNoiseStyle } from "@/lib/ui/page-noise";
import Bg from "@/components/shared/bg";

function ProjectInfoBar({ project }: { project: CatalogProject }) {
  return (
    <div className="flex w-full flex-col gap-[7px] bg-white/10 p-[19px] backdrop-blur-[12px]">
      <h2 className="font-libre-baskerville text-[26px] leading-none font-normal tracking-[0.15em] text-white uppercase">
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
  );
}

export default function SelectApartment({
  project,
}: {
  project: CatalogProject;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (choice: ApartmentChoice) => {
    setError(null);

    if (choice.designCode) {
      setPending(true);
      try {
        const design = await getDesign(choice.designCode);
        router.push(
          configuratorHref(
            {
              streamProjectId: design.streamProjectId,
              unitId: design.unitId,
              levelName: design.configuration.levelName,
            },
            { designCode: design.designCode },
          ),
        );
      } catch {
        setError("We couldn’t find that design code. Check it and try again.");
      } finally {
        setPending(false);
      }
      return;
    }

    router.push(
      stylesHref({
        slug: project.slug,
        unitId: choice.unitId || project.unitId,
        levelName: choice.levelName || project.levelName,
      }),
    );
  };

  return (
    <main
      className="relative min-h-dvh overflow-hidden bg-[#00272d] text-white lg:h-dvh"
      style={pageNoiseStyle(0.12)}
    >
      {/* <div className="pointer-events-none absolute inset-0 opacity-30"> */}
      {}
      {/* <img
          src="/images/projects/bg.png"
          alt=""
          className="h-full w-full object-cover"
        />
      </div> */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
        <Bg
          preserveAspectRatio="xMidYMid slice"
          className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 object-cover"
        />
      </div>

      <div className="pointer-events-none absolute inset-0 opacity-40 lg:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={project.image}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>

      <div className="relative z-10 flex min-h-dvh flex-col lg:h-dvh lg:flex-row">
        <AtelierMark
          href="/projects"
          label="Back to projects"
          className="z-20 self-center pt-6 lg:absolute lg:top-6 lg:left-1/2 lg:-translate-x-1/2 lg:pt-0"
        />

        <aside className="relative hidden min-h-dvh w-[50dvw] shrink-0 overflow-hidden lg:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.image}
            alt={project.name}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-x-9 bottom-9">
            <ProjectInfoBar project={project} />
          </div>
        </aside>

        <div className="flex flex-1 flex-col items-center justify-center px-5 py-16 sm:px-10 lg:w-[50dvw] lg:min-h-dvh">
          <ApartmentForm
            pending={pending}
            error={error}
            autoFocus
            onSubmit={(choice) => {
              void handleSubmit(choice);
            }}
          />
        </div>
      </div>
    </main>
  );
}
