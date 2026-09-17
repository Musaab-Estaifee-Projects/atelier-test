"use client";

import QuotationPageFrame, {
  QuotationPageHeader,
} from "@/components/pages/quotation/quotation-page-frame";

function Pulse({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-white/10 ${className}`} aria-hidden />
  );
}

function PanelShell({
  className = "",
  children,
  darker = false,
}: {
  className?: string;
  children: React.ReactNode;
  darker?: boolean;
}) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-none border border-white/10 opacity-60 ${
        darker ? "bg-[#00272D]" : "bg-white/4"
      } ${className}`}
    >
      {children}
    </div>
  );
}

const QuotationStatusClientSkeleton = () => {
  return (
    <QuotationPageFrame>
      <QuotationPageHeader />

      <div className="mt-10 flex w-full flex-1 flex-col items-stretch gap-5 md:flex-row md:items-stretch">
        {/* Preview — 2/3 */}
        <PanelShell className="md:w-[66.6666%]" darker>
          <div className="flex h-full min-h-120 w-full md:min-h-150">
            <div className="relative min-h-0 flex-1 overflow-hidden">
              <Pulse className="absolute inset-0 m-px" />
            </div>
          </div>
        </PanelShell>

        {/* Details — 1/3 */}
        <PanelShell className="md:w-[33.3333%]">
          <div className="flex h-full min-h-120 w-full md:min-h-150">
            <div className="relative flex w-full shrink-0 flex-col justify-between gap-8 p-7 lg:p-9">
              <div className="flex w-full flex-col items-center gap-8">
                <Pulse className="h-6.5 w-48 rounded-md" />

                <div className="flex w-full flex-col">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i}>
                      <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-3 md:flex-col md:items-start lg:flex-row lg:items-center">
                        <Pulse className="h-3 w-20 rounded-sm" />
                        <Pulse className="h-4 w-28 rounded-sm" />
                      </div>
                      <hr className="border border-white/10" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <Pulse className="h-11 w-full rounded-full" />
                  <Pulse className="h-11 w-full rounded-full" />
                  <Pulse className="h-11 w-full rounded-full" />
                </div>
                <Pulse className="mx-auto h-4 w-56 rounded-sm" />
              </div>
            </div>
          </div>
        </PanelShell>
      </div>

      <div className="mt-2 mb-4! flex shrink-0 flex-col items-center gap-2">
        <Pulse className="h-3 w-48 rounded-sm" />
        <Pulse className="mt-4 h-12 w-full max-w-70 rounded-full" />
      </div>

      <Pulse className="h-4 w-80 max-w-full rounded-sm" />
    </QuotationPageFrame>
  );
};

export default QuotationStatusClientSkeleton;
