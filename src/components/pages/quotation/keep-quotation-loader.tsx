import "server-only";
import { redirect } from "next/navigation";
import KeepQuotationClient from "@/components/pages/quotation/keep-quotation-client";
import QuotationNotFound from "@/components/pages/quotation/quotation-not-found";
import {
  isQuotationDesignCode,
  quotationCodeFromSlug,
} from "@/lib/quotation/design-code";
import { quotationPath } from "@/lib/quotation/share-url";
import {
  getSavedDesign,
  isSavedDesignValid,
} from "@/services/get-saved-design.service";

type Props = {
  slug: string;
};

const KeepQuotationLoader = async ({ slug }: Props) => {
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

  if (!result.data.quotation.is_expired || !isSavedDesignValid(result.data)) {
    redirect(quotationPath(code));
  }

  return <KeepQuotationClient source={result.data} />;
};

export default KeepQuotationLoader;
