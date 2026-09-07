import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AtelierMark from "@/components/icons/atelier-mark";
import Bg from "@/components/shared/bg";
import SelectApartment from "@/components/pages/projects/select-apartment";
import { pageNoiseStyle } from "@/lib/ui/page-noise";
import { getSingleProject } from "@/services/get-single-project.service";
import Image from "next/image";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const project = await getSingleProject(slug);
    return {
      title: `ATELIER · ${project.name}`,
      description:
        "Select your residence type and layout to start configuring.",
    };
  } catch {
    return {
      title: "ATELIER · Select apartment",
      description:
        "Select your residence type and layout to start configuring.",
    };
  }
}

const page = async ({ params }: PageProps) => {
  const { slug } = await params;

  let project;
  try {
    project = await getSingleProject(slug);
  } catch {
    notFound();
  }

  return (
    <main
      className="relative min-h-dvh overflow-hidden bg-[#00272d] text-white lg:h-dvh"
      style={pageNoiseStyle(0.11)}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
        <Bg
          preserveAspectRatio="xMidYMid slice"
          className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 object-cover"
        />
      </div>

      <div className="pointer-events-none absolute inset-0 opacity-40 lg:hidden">
        <Image
          src={project.image}
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
      </div>

      <div className="relative z-10 flex min-h-dvh flex-col lg:h-dvh lg:flex-row">
        <AtelierMark
          href="/projects"
          label="Back to projects"
          className="z-20 self-center pt-6 lg:absolute lg:top-6 lg:left-1/2 lg:-translate-x-1/2 lg:pt-0"
        />

        <SelectApartment project={project} />
      </div>
    </main>
  );
};

export default page;
