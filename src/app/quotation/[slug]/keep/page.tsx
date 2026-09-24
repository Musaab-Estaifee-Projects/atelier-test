import type { Metadata } from "next";
import { Suspense } from "react";
import KeepQuotationLoader from "@/components/pages/quotation/keep-quotation-loader";
import KeepSummarySkeleton from "@/components/pages/quotation/keep-summary-skeleton";
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
    title: `ATELIER · Keep ${isQuotationDesignCode(code) ? code : "quotation"}`,
    description: "Keep your customization and continue to renders.",
  };
}

async function KeepPage({ params }: PageProps) {
  const { slug } = await params;
  return <KeepQuotationLoader slug={slug} />;
}

const page = ({ params }: PageProps) => {
  return (
    <Suspense fallback={<KeepSummarySkeleton />}>
      <KeepPage params={params} />
    </Suspense>
  );
};

export default page;
