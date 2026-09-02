import type { Metadata } from "next";
import BrowseStyles from "@/components/pages/styles/browse-styles/browse-styles";

export const metadata: Metadata = {
  title: "ATELIER · Browse styles",
  description: "Choose a ready interior style.",
};

type PageProps = {
  searchParams: Promise<{
    project?: string;
    unit?: string;
    level?: string;
  }>;
};

const page = async ({ searchParams }: PageProps) => {
  const query = await searchParams;
  return (
    <BrowseStyles
      projectSlug={query.project}
      unitId={query.unit}
      levelName={query.level}
    />
  );
};

export default page;
