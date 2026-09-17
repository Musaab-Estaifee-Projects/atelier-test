import type { Metadata } from "next";
import QuotationEntryClient from "@/components/pages/quotation/quotation-entry-client";

export const dynamic = "force-dynamic";
// export const revalidate = 0;

export const metadata: Metadata = {
  title: "ATELIER · Return to your configuration",
  description:
    "Enter the reference from your quotation PDF to return to a saved configuration.",
};

const page = () => {
  return <QuotationEntryClient />;
};

export default page;
