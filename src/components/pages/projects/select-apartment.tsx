"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ApartmentForm, {
  type ApartmentChoice,
} from "@/components/pages/projects/apartment-form";
import { getDesign } from "@/lib/configurator/api";
import { configuratorHref, stylesHref } from "@/lib/projects/catalog";
import { TProject } from "@/types/types";
import ProjectInfoBar from "./project-info-bar";
import Image from "next/image";

type Props = {
  project: TProject;
};

const SelectApartment = ({ project }: Props) => {
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
              projectId: String(project.id),
              levelName: design.configuration.levelName,
              layoutCode: design.configuration.levelName,
            },
            { designCode: design.designCode, view: true },
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
        slug: project.code,
        projectId: String(project.id),
        unitId: choice.unitId,
        levelName: choice.layoutCode || choice.levelName,
        layoutCode: choice.layoutCode || choice.levelName,
      }),
    );
  };

  return (
    <>
      <aside className="relative hidden min-h-dvh w-[50dvw] shrink-0 overflow-hidden lg:block">
        {/* className="pointer-events-none absolute inset-0 h-full w-full object-cover" */}

        <Image
          src={project.image}
          alt={project.name}
          fill
          className="pointer-events-none object-cover"
          sizes="50vw"
          priority
        />
        <div className="absolute inset-x-9 bottom-9">
          <ProjectInfoBar project={project} />
        </div>
      </aside>

      <div className="flex flex-1 flex-col items-center justify-center px-5 py-16 sm:px-10 lg:w-[50dvw] lg:min-h-dvh">
        <ApartmentForm
          project={project}
          pending={pending}
          error={error}
          autoFocus
          onSubmit={(choice) => {
            void handleSubmit(choice);
          }}
        />
      </div>
    </>
  );
};

export default SelectApartment;
