import type { Metadata } from "next";
import SelectStyle from "@/components/pages/styles/select-style";
import { streamAppIdForProjectCode } from "@/lib/projects/stream-app-id";

export const metadata: Metadata = {
  title: "ATELIER · Select a style",
  description:
    "Choose a ready interior style or start customizing your apartment from scratch.",
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

const StylesPage = async ({ searchParams }: PageProps) => {
  const query = await searchParams;
  const streamProjectId = await streamAppIdForProjectCode(query.project);
  return (
    <SelectStyle
      projectSlug={query.project}
      projectId={query.project_id}
      streamProjectId={streamProjectId}
      apartmentId={query.apartment_id}
      apartmentNumber={query.apartment_number || query.unit}
      unitId={query.apartment_number || query.unit}
      levelName={query.layout_code || query.level}
    />
  );
};

export default StylesPage;
