export const SITE_NAV_LINKS = [
  { href: "/about", label: "ABOUT" },
  { href: "/projects", label: "PROJECTS" },
  { href: "/quotation", label: "REFERENCE NUMBER" },
] as const;

export type SiteNavHref = (typeof SITE_NAV_LINKS)[number]["href"];

export function isSiteNavActive(pathname: string, href: string): boolean {
  const path = pathname.split("?")[0] || "/";
  if (href === "/projects") {
    return path === "/projects" || path.startsWith("/projects/");
  }
  if (href === "/quotation") {
    return path === "/quotation" || path.startsWith("/quotation/");
  }
  return path === href || path.startsWith(`${href}/`);
}

export function shouldShowLayoutSiteNav(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === "/") return false;
  if (pathname.startsWith("/configurator")) return false;
  if (/^\/quotation\/[^/]+\/keep\/?$/.test(pathname)) return false;
  return true;
}
