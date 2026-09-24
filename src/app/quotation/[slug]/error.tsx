"use client";

import { useEffect } from "react";
import QuotationNotFound from "@/components/pages/quotation/quotation-not-found";

export default function QuotationError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[quotation] segment error", error.digest ?? error.message);
  }, [error]);

  return (
    <QuotationNotFound
      title="Something went wrong"
      message="We couldn’t load this quotation. Please try again."
      hint="If the problem persists, enter your reference again."
      onRetry={retry}
    />
  );
}
