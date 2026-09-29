import { NextResponse } from "next/server";
import { ENDPOINTS } from "@/lib/endpoints";
import { env } from "@/lib/env";
import {
  isQuotationDesignCode,
  quotationCodeFromSlug,
} from "@/lib/quotation/design-code";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UNAVAILABLE = "The PDF quotation is not available yet.";
const FAILED = "Could not download the quotation. Please try again.";

function isPdfResponse(response: Response): boolean {
  const type = (response.headers.get("content-type") ?? "").toLowerCase();
  return (
    response.ok &&
    Boolean(response.body) &&
    (type.includes("pdf") || type.includes("octet-stream"))
  );
}

async function fetchPdf(url: string): Promise<Response> {
  return fetch(url, {
    redirect: "follow",
    cache: "no-store",
    headers: { Accept: "application/pdf, application/octet-stream" },
    signal: AbortSignal.timeout(60_000),
  });
}

/** One retry for a dropped or non-PDF upstream response. 400 and 404 stay as-is. */
async function loadPdf(url: string): Promise<Response | null> {
  try {
    const first = await fetchPdf(url);
    if (isPdfResponse(first) || first.status === 400 || first.status === 404) {
      return first;
    }
  } catch {
    /* retry the signed download once */
  }
  try {
    return await fetchPdf(url);
  } catch {
    return null;
  }
}

type RouteContext = {
  params: Promise<{ designCode: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { designCode } = await context.params;
  const code = quotationCodeFromSlug(designCode);
  if (!isQuotationDesignCode(code)) {
    return NextResponse.json(
      { message: "Missing quotation reference." },
      { status: 400 },
    );
  }

  const base = env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "");
  const upstream = await loadPdf(
    `${base}${ENDPOINTS.DOWNLOAD_QUOTATION(code)}`,
  );
  if (!upstream) {
    return NextResponse.json({ message: FAILED }, { status: 502 });
  }

  if (!isPdfResponse(upstream) || !upstream.body) {
    return NextResponse.json(
      { message: await upstreamMessage(upstream) },
      { status: upstream.status >= 400 ? upstream.status : 502 },
    );
  }

  const headers = new Headers();
  headers.set("Content-Type", "application/pdf");
  headers.set("Cache-Control", "no-store, no-transform");
  headers.set(
    "Content-Disposition",
    safeDisposition(
      upstream.headers.get("content-disposition"),
      `${code}-quotation.pdf`,
    ),
  );
  const length = upstream.headers.get("content-length");
  if (length && /^\d+$/.test(length)) headers.set("Content-Length", length);

  return new NextResponse(upstream.body, { status: 200, headers });
}

function safeDisposition(header: string | null, fallback: string): string {
  const encoded = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(header ?? "");
  const plain = /filename="?([^";]+)"?/i.exec(header ?? "");
  let name = fallback;
  if (encoded?.[1]) {
    try {
      name = decodeURIComponent(encoded[1].trim().replace(/^"|"$/g, ""));
    } catch {
      name = plain?.[1]?.trim() || fallback;
    }
  } else if (plain?.[1]?.trim()) {
    name = plain[1].trim();
  }
  const cleaned = name.replace(/[/\\?%*:|"<>\r\n]/g, "").trim() || fallback;
  const filename = cleaned.toLowerCase().endsWith(".pdf")
    ? cleaned
    : `${cleaned}.pdf`;
  return `attachment; filename="${filename}"`;
}

async function upstreamMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: unknown };
    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message.trim();
    }
  } catch {
    /* body was not JSON */
  }
  if (response.status === 404) return UNAVAILABLE;
  return FAILED;
}
