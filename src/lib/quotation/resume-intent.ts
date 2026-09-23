export type QuotationResumeMode = "view" | "edit" | "keep-offline" | "fresh";

export type QuotationResumeIntent = {
  sourceDesignCode: string;
  streamProjectId: string;
  projectId: string;
  layoutCode: string;
  apartmentId: string | null;
  apartmentNumber: string | null;
  mode: QuotationResumeMode;
  clonedDesignCode?: string | null;
};

const KEY = "atelier:quotation-resume";

export function writeQuotationResume(intent: QuotationResumeIntent): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(intent));
  } catch {
    /* private mode */
  }
}

export function readQuotationResume(): QuotationResumeIntent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as QuotationResumeIntent;
    if (!parsed?.sourceDesignCode || !parsed.streamProjectId || !parsed.mode) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function patchQuotationResume(
  patch: Partial<QuotationResumeIntent>,
): QuotationResumeIntent | null {
  const current = readQuotationResume();
  if (!current) return null;
  const next = { ...current, ...patch };
  writeQuotationResume(next);
  return next;
}

export function clearQuotationResume(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function configuratorResumeHref(args: {
  streamProjectId: string;
  projectId: string;
  layoutCode: string;
  apartmentId?: string | null;
  apartmentNumber?: string | null;
  view?: boolean;
  summary?: boolean;
}): string {
  const query = new URLSearchParams();
  if (args.projectId) query.set("project_id", args.projectId);
  if (args.layoutCode) query.set("layout_code", args.layoutCode);
  if (args.apartmentId) query.set("apartment_id", args.apartmentId);
  if (args.apartmentNumber) {
    query.set("apartment_number", args.apartmentNumber);
  }
  if (args.view) query.set("view", "1");
  if (args.summary) query.set("summary", "1");
  const qs = query.toString();
  return `/configurator/${encodeURIComponent(args.streamProjectId)}${qs ? `?${qs}` : ""}`;
}
