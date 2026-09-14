import type { Metadata } from "next";
import BrowseStyles from "@/components/pages/styles/browse-styles/browse-styles";

export const metadata: Metadata = {
  title: "ATELIER · Browse styles",
  description: "Choose a ready interior style.",
};

type PageProps = {
  searchParams: Promise<{
    project?: string;
    project_id?: string;
    apartment_id?: string;
    unit?: string;
    level?: string;
    layout_code?: string;
  }>;
};

const page = async ({ searchParams }: PageProps) => {
  const query = await searchParams;
  return (
    <BrowseStyles
      projectSlug={query.project}
      projectId={query.project_id}
      unitId={query.unit}
      apartmentId={query.apartment_id}
      levelName={query.layout_code || query.level}
    />
  );
};

export default page;
