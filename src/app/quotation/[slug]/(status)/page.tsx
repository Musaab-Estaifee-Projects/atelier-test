import type { Metadata } from "next";
import { Suspense } from "react";
import QuotationStatusLoader from "@/components/pages/quotation/quotation-status-loader";
import QuotationStatusSkeleton from "@/components/pages/quotation/quotation-status-skeleton";
import {
  isQuotationDesignCode,
  quotationCodeFromSlug,
} from "@/lib/quotation/design-code";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const code = quotationCodeFromSlug(slug);
  return {
    title: `ATELIER · ${isQuotationDesignCode(code) ? code : "Quotation"}`,
    description: "Return to a saved quotation and configuration.",
  };
}

async function StatusPage({ params }: PageProps) {
  const { slug } = await params;
  return <QuotationStatusLoader slug={slug} />;
}

const page = ({ params }: PageProps) => {
  return (
    <Suspense fallback={<QuotationStatusSkeleton />}>
      <StatusPage params={params} />
    </Suspense>
  );
};

export default page;
