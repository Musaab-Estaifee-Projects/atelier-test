import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CustomShape } from "@/components/shared/custom-shape";
import QuotationPageFrame, {
  QuotationPageHeader,
} from "@/components/pages/quotation/quotation-page-frame";

type Props = {
  designCode?: string;
  message?: string;
  title?: string;
  hint?: string;
  onRetry?: () => void;
};

const QuotationNotFound = ({
  designCode,
  message = "We couldn’t find a quotation for this reference.",
  title = "Quotation not found",
  hint = "Check the reference on your quotation PDF and try again.",
  onRetry,
}: Props) => {
  return (
    <QuotationPageFrame>
      <QuotationPageHeader />

      <div className="mt-10 flex w-full flex-1 flex-col items-stretch gap-5 md:flex-row md:items-stretch">
        <CustomShape
          className="relative w-full overflow-hidden md:w-[66.6666%]"
          radius={{ base: 18, sm: 20, md: 24 }}
          fill="#00272D"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={1.33}
        >
          <div className="flex h-full min-h-120 w-full items-center justify-center md:min-h-150">
            <p className="max-w-80 px-6 text-center text-sm leading-[1.6] text-white/70">
              {message}
              {designCode ? (
                <>
                  <br />
                  <span className="mt-2 inline-block font-medium uppercase tracking-wider text-white">
                    {designCode}
                  </span>
                </>
              ) : null}
            </p>
          </div>
        </CustomShape>

        <CustomShape
          className="relative w-full overflow-hidden md:w-[33.3333%]"
          radius={{ base: 18, sm: 20, md: 24 }}
          fill="rgba(255,255,255,0.04)"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={1}
        >
          <div className="flex h-full min-h-120 w-full md:min-h-150">
            <div className="relative flex w-full shrink-0 flex-col justify-between gap-8 p-7 lg:p-9">
              <div className="flex w-full flex-col items-center gap-4 text-center">
                <h2 className="font-baskerville text-[1.625rem] leading-[116%] capitalize text-[#F2E9D8]">
                  {title}
                </h2>
                <p className="text-sm leading-[1.6] text-white/70">{hint}</p>
              </div>
              <div className="flex flex-col gap-2">
                {onRetry ? (
                  <Button
                    type="button"
                    variant="pill-solid"
                    size="pill"
                    onClick={onRetry}
                  >
                    Try again
                  </Button>
                ) : null}
                <Button variant={onRetry ? "pill" : "pill-solid"} size="pill" asChild>
                  <Link href="/quotation">Enter another reference</Link>
                </Button>
                <Button variant="pill" size="pill" asChild>
                  <Link href="/projects">Start Your Experience</Link>
                </Button>
              </div>
            </div>
          </div>
        </CustomShape>
      </div>
    </QuotationPageFrame>
  );
};

export default QuotationNotFound;
