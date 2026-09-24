import { NextResponse, type NextRequest } from "next/server";

/** Malformed percent-encoding would otherwise crash dynamic param decoding with a 500. */
export function proxy(request: NextRequest) {
  try {
    decodeURIComponent(request.nextUrl.pathname);
  } catch {
    return new NextResponse("Bad Request", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/quotation/:path*", "/projects/:path*", "/configurator/:path*"],
};
