import { CustomShape } from "@/components/shared/custom-shape";
import QuotationPageFrame, {
  QuotationPageHeader,
} from "@/components/pages/quotation/quotation-page-frame";

const QuotationStatusSkeleton = () => {
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
          <div className="flex h-full min-h-120 w-full md:min-h-150">
            <div className="relative min-h-0 flex-1 overflow-hidden">
              <div className="absolute inset-0 m-px animate-pulse bg-white/10" />
            </div>
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
              <div className="flex w-full flex-col items-center gap-8">
                <div className="h-6.5 w-48 animate-pulse bg-white/10" />
                <div className="flex w-full flex-col">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i}>
                      <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-3 md:flex-col md:items-start lg:flex-row lg:items-center">
                        <div className="h-3 w-20 animate-pulse bg-white/10" />
                        <div className="h-4 w-28 animate-pulse bg-white/10" />
                      </div>
                      <hr className="border border-white/10" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <div className="h-11 w-full animate-pulse rounded-full bg-white/10" />
                  <div className="h-11 w-full animate-pulse rounded-full bg-white/10" />
                  <div className="h-11 w-full animate-pulse rounded-full bg-white/10" />
                </div>
                <div className="mx-auto h-4 w-56 animate-pulse bg-white/10" />
              </div>
            </div>
          </div>
        </CustomShape>
      </div>

      <div className="mt-2 mb-4! flex shrink-0 flex-col items-center gap-2">
        <div className="h-3 w-48 animate-pulse bg-white/10" />
        <div className="mt-4 h-12 w-full max-w-70 animate-pulse rounded-full bg-white/10" />
      </div>

      <div className="h-4 w-80 max-w-full animate-pulse bg-white/10" />
    </QuotationPageFrame>
  );
};

export default QuotationStatusSkeleton;

// import QuotationPageFrame, {
//   QuotationPageHeader,
// } from "@/components/pages/quotation/quotation-page-frame";

// function Pulse({ className = "" }: { className?: string }) {
//   return (
//     <div className={`animate-pulse bg-white/10 ${className}`} aria-hidden />
//   );
// }

// function PanelShell({
//   className = "",
//   children,
//   darker = false,
// }: {
//   className?: string;
//   children: React.ReactNode;
//   darker?: boolean;
// }) {
//   return (
//     <div
//       className={`relative w-full overflow-hidden rounded-none border border-white/10 opacity-60 ${
//         darker ? "bg-[#00272D]" : "bg-white/4"
//       } ${className}`}
//     >
//       {children}
//     </div>
//   );
// }

// const QuotationStatusSkeleton = () => {
//   return (
//     <QuotationPageFrame>
//       <QuotationPageHeader />

//       <div className="mt-10 flex w-full flex-1 flex-col items-stretch gap-5 md:flex-row md:items-stretch">
//         {/* Preview — 2/3 */}
//         <PanelShell className="md:w-[66.6666%]" darker>
//           <div className="flex h-full min-h-120 w-full md:min-h-150">
//             <div className="relative min-h-0 flex-1 overflow-hidden">
//               <Pulse className="absolute inset-0 m-px" />
//             </div>
//           </div>
//         </PanelShell>

//         <PanelShell className="md:w-[33.3333%]">
//           <div className="flex h-full min-h-120 w-full md:min-h-150">
//             <div className="relative flex w-full shrink-0 flex-col justify-between gap-8 p-7 lg:p-9">
//               <div className="flex w-full flex-col items-center gap-8">
//                 <Pulse className="h-6.5 w-48 rounded-md" />

//                 <div className="flex w-full flex-col">
//                   {Array.from({ length: 4 }).map((_, i) => (
//                     <div key={i}>
//                       <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-3 md:flex-col md:items-start lg:flex-row lg:items-center">
//                         <Pulse className="h-3 w-20 rounded-sm" />
//                         <Pulse className="h-4 w-28 rounded-sm" />
//                       </div>
//                       <hr className="border border-white/10" />
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               <div className="flex flex-col gap-6">
//                 <div className="flex flex-col gap-2">
//                   <Pulse className="h-11 w-full rounded-full" />
//                   <Pulse className="h-11 w-full rounded-full" />
//                   <Pulse className="h-11 w-full rounded-full" />
//                 </div>
//                 <Pulse className="mx-auto h-4 w-56 rounded-sm" />
//               </div>
//             </div>
//           </div>
//         </PanelShell>
//       </div>

//       <div className="mt-2 mb-4! flex shrink-0 flex-col items-center gap-2">
//         <Pulse className="h-3 w-48 rounded-sm" />
//         <Pulse className="mt-4 h-12 w-full max-w-70 rounded-full" />
//       </div>

//       <Pulse className="h-4 w-80 max-w-full rounded-sm" />
//     </QuotationPageFrame>
//   );
// };

// export default QuotationStatusSkeleton;
