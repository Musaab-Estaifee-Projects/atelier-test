import { redirect } from "next/navigation";
import KeepQuotationClient from "@/components/pages/quotation/keep-quotation-client";
import QuotationNotFound from "@/components/pages/quotation/quotation-not-found";
import {
  isQuotationDesignCode,
  normalizeQuotationDesignCode,
} from "@/lib/quotation/design-code";
import {
  getSavedDesign,
  isSavedDesignValid,
} from "@/services/get-saved-design.service";

type Props = {
  slug: string;
};

const KeepQuotationLoader = async ({ slug }: Props) => {
  const code = normalizeQuotationDesignCode(decodeURIComponent(slug));

  if (!isQuotationDesignCode(code)) {
    return <QuotationNotFound designCode={slug} />;
  }

  const result = await getSavedDesign(code);

  if (!result.ok) {
    return (
      <QuotationNotFound
        designCode={code}
        message={
          result.reason === "failed"
            ? "We couldn’t load this quotation. Please try again."
            : "We couldn’t find a quotation for this reference."
        }
      />
    );
  }

  if (!result.data.quotation.is_expired || !isSavedDesignValid(result.data)) {
    redirect(`/quotation/${encodeURIComponent(code)}`);
  }

  return <KeepQuotationClient source={result.data} />;
};

export default KeepQuotationLoader;
