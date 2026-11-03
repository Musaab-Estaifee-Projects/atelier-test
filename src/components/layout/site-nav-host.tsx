"use client";

import { usePathname } from "next/navigation";
import { shouldShowLayoutSiteNav } from "@/constants/site-nav";
import SiteNav from "@/components/layout/site-nav";

/** Renders the site nav on marketing/journey pages; home and configurator keep their own chrome. */
export default function SiteNavHost() {
  const pathname = usePathname();
  if (!shouldShowLayoutSiteNav(pathname)) return null;
  return <SiteNav variant="layout" />;
}
