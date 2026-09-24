import "server-only";
import QuotationStatusClient from "@/components/pages/quotation/quotation-status-client";
import QuotationNotFound from "@/components/pages/quotation/quotation-not-found";
import {
  isQuotationDesignCode,
  quotationCodeFromSlug,
} from "@/lib/quotation/design-code";
import { getSavedDesign } from "@/services/get-saved-design.service";

type Props = {
  slug: string;
};

const QuotationStatusLoader = async ({ slug }: Props) => {
  const code = quotationCodeFromSlug(slug);

  if (!isQuotationDesignCode(code)) {
    return <QuotationNotFound />;
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

  return <QuotationStatusClient data={result.data} />;
};

export default QuotationStatusLoader;
