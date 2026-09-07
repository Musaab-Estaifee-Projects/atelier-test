import type { Metadata } from "next";
import ReferenceNumberStatus from "@/components/pages/reference-number/reference-number-status-client";

export const metadata: Metadata = {
  title: "ATELIER · Return to your configuration",
  description:
    "Enter the reference from your quotation PDF to return to a saved configuration.",
};

export default function Page() {
  return <ReferenceNumberStatus />;
}
