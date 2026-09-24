"use client";

import { useRouter } from "next/navigation";
import ApartmentForm, {
  type ApartmentChoice,
} from "@/components/pages/projects/apartment-form";
import { writeResidenceLabel } from "@/lib/configurator/residence-label";
import { stylesHref } from "@/lib/projects/catalog";
import { quotationPath } from "@/lib/quotation/share-url";
import { TProject } from "@/types/types";
import ProjectInfoBar from "./project-info-bar";
import Image from "next/image";

type Props = {
  project: TProject;
};

const SelectApartment = ({ project }: Props) => {
  const router = useRouter();

  const handleSubmit = (choice: ApartmentChoice) => {
    if (choice.designCode) {
      router.push(quotationPath(choice.designCode));
      return;
    }

    writeResidenceLabel({
      projectSlug: project.code,
      projectName: project.name,
      categoryName: choice.categoryName,
      typeName: choice.typeName,
      layoutCode: choice.layoutCode || choice.levelName,
      apartmentNumber: choice.apartmentNumber || choice.unitId || null,
      area: choice.area || null,
    });

    router.push(
      stylesHref({
        slug: project.code,
        projectId: String(project.id),
        unitId: "",
        apartmentId: choice.apartmentId,
        apartmentNumber: choice.apartmentNumber || choice.unitId,
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
          autoFocus
          onSubmit={handleSubmit}
        />
      </div>
    </>
  );
};

export default SelectApartment;
