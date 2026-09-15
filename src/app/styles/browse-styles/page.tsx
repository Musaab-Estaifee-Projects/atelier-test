import type { Metadata } from "next";
import BrowseStyles from "@/components/pages/styles/browse-styles/browse-styles";
import { streamAppIdForProjectCode } from "@/lib/projects/stream-app-id";

export const metadata: Metadata = {
  title: "ATELIER · Browse styles",
  description: "Choose a ready interior style.",
};

type PageProps = {
  searchParams: Promise<{
    project?: string;
    project_id?: string;
    apartment_id?: string;
    apartment_number?: string;
    unit?: string;
    level?: string;
    layout_code?: string;
  }>;
};

const page = async ({ searchParams }: PageProps) => {
  const query = await searchParams;
  const streamProjectId = await streamAppIdForProjectCode(query.project);
  return (
    <BrowseStyles
      projectSlug={query.project}
      projectId={query.project_id}
      streamProjectId={streamProjectId}
      unitId={query.apartment_number || query.unit}
      apartmentId={query.apartment_id}
      apartmentNumber={query.apartment_number || query.unit}
      levelName={query.layout_code || query.level}
    />
  );
};

export default page;
