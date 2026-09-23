import type { Metadata } from "next";
import { Suspense } from "react";
import KeepQuotationLoader from "@/components/pages/quotation/keep-quotation-loader";
import QuotationStatusSkeleton from "@/components/pages/quotation/quotation-status-skeleton";
import { normalizeQuotationDesignCode } from "@/lib/quotation/design-code";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const code = normalizeQuotationDesignCode(decodeURIComponent(slug));
  return {
    title: `ATELIER · Keep ${code || "quotation"}`,
    description: "Keep your customization and continue to renders.",
  };
}

const page = async ({ params }: PageProps) => {
  const { slug } = await params;
  return (
    <Suspense fallback={<QuotationStatusSkeleton />}>
      <KeepQuotationLoader slug={slug} />
    </Suspense>
  );
};

export default page;
