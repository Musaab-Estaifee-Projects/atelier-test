const PENDING = new Set(["pending", "processing", "queued", "in_progress"]);
const COMPLETE = new Set(["ready", "completed", "complete", "sent", "done"]);
const FAILED = new Set(["failed", "error", "cancelled", "canceled"]);

export function formatQuotationJobStatus(status: string | null | undefined) {
  const raw = status?.trim();
  if (!raw) return "Unknown";
  return raw
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function quotationJobKind(
  status: string | null | undefined,
): "pending" | "complete" | "failed" | "unknown" {
  const key = status?.trim().toLowerCase() ?? "";
  if (!key) return "unknown";
  if (PENDING.has(key)) return "pending";
  if (COMPLETE.has(key)) return "complete";
  if (FAILED.has(key)) return "failed";
  return "unknown";
}
