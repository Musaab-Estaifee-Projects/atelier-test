import {
  isQuotationDesignCode,
  normalizeQuotationDesignCode,
} from "@/lib/quotation/design-code";

export type DownloadQuotationResult =
  | { ok: true }
  | { ok: false; message: string };

const UNAVAILABLE = "The PDF quotation is not available yet.";
const FAILED = "Could not download the quotation. Please try again.";

function filenameFromDisposition(header: string | null, fallback: string): string {
  const value = header ?? "";
  const encoded = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(value);
  if (encoded?.[1]) {
    try {
      return safeFilename(
        decodeURIComponent(encoded[1].trim().replace(/^"|"$/g, "")),
        fallback,
      );
    } catch {
      /* use the plain filename or the fallback */
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(value);
  return safeFilename(plain?.[1] ?? "", fallback);
}

function safeFilename(name: string, fallback: string): string {
  const cleaned = name.replace(/[/\\?%*:|"<>]/g, "").trim();
  if (!cleaned) return fallback;
  return cleaned.toLowerCase().endsWith(".pdf") ? cleaned : `${cleaned}.pdf`;
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

async function messageFromBlob(blob: Blob): Promise<string | null> {
  try {
    const text = (await blob.text()).trim();
    if (!text.startsWith("{") && !text.startsWith("[")) return null;
    const payload = JSON.parse(text) as { message?: unknown };
    return typeof payload.message === "string" && payload.message.trim()
      ? payload.message.trim()
      : null;
  } catch {
    return null;
  }
}

/**
 * Downloads through the same-origin proxy so the signed S3 redirect is never
 * read by the browser. `onProgress` receives 0–100 while bytes arrive.
 */
export function downloadQuotationPdf(
  designCode: string,
  onProgress?: (percent: number) => void,
): Promise<DownloadQuotationResult> {
  const code = normalizeQuotationDesignCode(designCode);
  if (!isQuotationDesignCode(code)) {
    return Promise.resolve({
      ok: false,
      message: "Missing quotation reference.",
    });
  }

  const url = `/api/quotation/${encodeURIComponent(code)}/download`;

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = "blob";
    onProgress?.(0);

    xhr.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable || event.total <= 0) return;
      const percent = Math.min(
        100,
        Math.round((event.loaded / event.total) * 100),
      );
      onProgress(percent);
    };

    xhr.onload = () => {
      void (async () => {
        const blob = xhr.response;
        if (!(blob instanceof Blob) || blob.size === 0) {
          resolve({ ok: false, message: UNAVAILABLE });
          return;
        }
        const type = (
          xhr.getResponseHeader("content-type") ??
          blob.type ??
          ""
        ).toLowerCase();
        if (xhr.status < 200 || xhr.status >= 300 || type.includes("json")) {
          resolve({
            ok: false,
            message:
              (await messageFromBlob(blob)) ||
              (xhr.status === 404 ? UNAVAILABLE : FAILED),
          });
          return;
        }
        onProgress?.(100);
        saveBlob(
          blob,
          filenameFromDisposition(
            xhr.getResponseHeader("content-disposition"),
            `${code}-quotation.pdf`,
          ),
        );
        resolve({ ok: true });
      })();
    };

    xhr.onerror = () => resolve({ ok: false, message: FAILED });
    xhr.onabort = () => resolve({ ok: false, message: FAILED });
    xhr.send();
  });
}
