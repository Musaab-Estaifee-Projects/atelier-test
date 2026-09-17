import AtelierMark from "@/components/icons/atelier-mark";
import Bg from "@/components/shared/bg";
import { pageNoiseStyle } from "@/lib/ui/page-noise";
import EnterReference from "./enter-reference";

const QuotationEntryPage = () => {
  return (
    <main
      className="relative min-h-dvh bg-[#00272d] text-white"
      style={pageNoiseStyle(0.11)}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
        <Bg
          preserveAspectRatio="xMidYMid slice"
          className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 object-cover"
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh w-full flex-col items-center justify-center px-5 py-16">
        <AtelierMark href="/" />
        <h1 className="mt-10 text-center font-baskerville text-[clamp(22px,2.2vw,27.4px)] leading-[1.16] font-normal tracking-wider text-[#f2e9d8] capitalize">
          Return to your configuration
        </h1>
        <p className="mt-4 max-w-md text-center text-sm leading-[1.6] text-white/70">
          Enter the reference from your quotation PDF to open your saved design.
        </p>

        <EnterReference />
      </div>
    </main>
  );
};

export default QuotationEntryPage;
