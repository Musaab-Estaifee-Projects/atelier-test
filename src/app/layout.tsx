import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist } from "next/font/google";
import "./globals.css";
import { JotaiProvider } from "@/lib/jotai-provider";
import { Suspense } from "react";
import ScrollToTop from "@/components/shared/scroll-to-top";
import LenisWrapper from "@/context/lenis-wrapper";
import QueryProvider from "@/providers/query-provider";
import SiteNavHost from "@/components/layout/site-nav-host";
import PageTransition from "@/components/layout/page-transition/page-transition";

const generalSans = localFont({
  src: "./fonts/GeneralSans-Variable.woff2",
  variable: "--font-general-sans",
  display: "swap",
});

const baskerville = localFont({
  src: "./fonts/Baskerville.woff2",
  variable: "--font-baskerville",
  display: "swap",
});

// const baskerville = Baskervville({
//   variable: "--font-baskerville",
//   subsets: ["latin"],
// });

const snellRoundhand = localFont({
  src: "./fonts/SnellRoundhand.woff2",
  variable: "--font-snell-roundhand",
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ATELIER",
  description:
    "Where ideas, insights, and stories come together. Explore the latest from REEF, market perspectives, design thinking, and updates across our developments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${generalSans.variable} ${baskerville.variable} ${snellRoundhand.variable} ${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <JotaiProvider>
          <PageTransition>
            <Suspense>
              <ScrollToTop />
            </Suspense>
            <LenisWrapper />
            <SiteNavHost />
            <QueryProvider>{children}</QueryProvider>
          </PageTransition>
        </JotaiProvider>
      </body>
    </html>
  );
}
