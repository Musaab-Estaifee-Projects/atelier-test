import AtelierMark from "@/components/icons/atelier-mark";
import Bg from "@/components/shared/bg";
import { pageNoiseStyle } from "@/lib/ui/page-noise";

type Props = {
  children: React.ReactNode;
};

const QuotationPageFrame = ({ children }: Props) => {
  return (
    <main
      className="relative min-h-dvh! bg-[#00272d] text-white"
      style={{
        ...pageNoiseStyle(0.11),
      }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
        <Bg
          preserveAspectRatio="xMidYMid slice"
          className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 object-cover"
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh w-full flex-col items-center gap-8 px-5 pt-6 pb-6 sm:px-8 sm:pt-8 sm:pb-8 lg:px-10 lg:pt-6 lg:pb-8">
        {children}
      </div>
    </main>
  );
};

export default QuotationPageFrame;

export const QuotationPageHeader = ({
  subtitle,
  notice,
}: {
  subtitle?: string;
  notice?: string | null;
}) => {
  return (
    <header className="flex shrink-0 flex-col items-center">
      <AtelierMark href="/" />

      <div className="flex flex-col items-center justify-center gap-3">
        <span className="mt-12 text-white text-[0.625rem] font-medium leading-[120%] tracking-[0.01875rem] uppercase">
          Welcome Back
        </span>

        <h1 className="font-baskerville text-[2rem] md:text-[2.25rem] leading-[116%] font-normal tracking-[0.1125rem] text-[#F2E9D8] capitalize">
          Your Custom Design
        </h1>

        {subtitle ? (
          <p className="text-white text-sm leading-[120%] opacity-70 text-center">
            {subtitle}
          </p>
        ) : (
          <div className="h-4 w-64 animate-pulse bg-white/10" />
        )}

        <div className="mt-3 h-px w-32.25 overflow-clip">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/review/header-rule.svg"
            alt=""
            className="h-full w-full"
          />
        </div>

        {notice ? (
          <p
            role="status"
            className="mt-2 max-w-lg text-center text-[13px] leading-normal text-[#FF8585]"
          >
            {notice}
          </p>
        ) : null}
      </div>
    </header>
  );
};
