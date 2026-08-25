import type { Metadata } from "next";
import SelectProject from "@/components/pages/projects/select-project";

export const metadata: Metadata = {
  title: "ATELIER · Return to your configuration",
  description:
    "Enter the reference from your quotation PDF to return to a saved configuration.",
};

const ReferenceNumberPage = () => {
  return <SelectProject initialReturn />;
};

export default ReferenceNumberPage;
