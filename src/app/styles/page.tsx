import type { Metadata } from "next";
import SelectStyle from "@/components/pages/styles/select-style";

export const metadata: Metadata = {
  title: "ATELIER · Select a style",
  description:
    "Choose a ready interior style or start customizing your apartment from scratch.",
};

type PageProps = {
  searchParams: Promise<{
    project?: string;
    unit?: string;
    level?: string;
  }>;
};

const StylesPage = async ({ searchParams }: PageProps) => {
  const query = await searchParams;
  return (
    <SelectStyle
      projectSlug={query.project}
      unitId={query.unit}
      levelName={query.level}
    />
  );
};

export default StylesPage;
