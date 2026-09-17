import type { Metadata } from "next";
import { Suspense } from "react";
import QuotationStatusLoader from "@/components/pages/quotation/quotation-status-loader";
import QuotationStatusSkeleton from "@/components/pages/quotation/quotation-status-skeleton";
import { normalizeQuotationDesignCode } from "@/lib/quotation/design-code";

export const dynamic = "force-dynamic";
// export const revalidate = 0;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const code = normalizeQuotationDesignCode(decodeURIComponent(slug));
  return {
    title: `ATELIER · ${code || "Quotation"}`,
    description: "Return to a saved quotation and configuration.",
  };
}

const page = async ({ params }: PageProps) => {
  const { slug } = await params;
  return (
    <Suspense fallback={<QuotationStatusSkeleton />}>
      <QuotationStatusLoader slug={slug} />
    </Suspense>
  );
};

export default page;
