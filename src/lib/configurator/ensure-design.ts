import { createDesign } from "@/services/create-design.service";
import { clearDraft, loadDraft, saveDraft } from "@/lib/configurator/storage";
import { isBackendProjectId } from "@/lib/projects/project-id";

export async function ensureBackendDesign(args: {
  streamProjectId: string;
  backendProjectId: string;
  layoutCode: string;
  apartmentId?: string | null;
}): Promise<{ designCode: string; returning: boolean }> {
  const draft = loadDraft(
    args.streamProjectId,
    args.backendProjectId,
    args.layoutCode,
    args.apartmentId,
  );
  const existing = draft?.designCode?.trim();
  if (existing) {
    return { designCode: existing, returning: true };
  }

  if (!isBackendProjectId(args.backendProjectId)) {
    throw new Error("A valid project is required to create a design.");
  }

  const apartmentRaw = args.apartmentId?.trim();
  const apartmentId =
    apartmentRaw && /^\d+$/.test(apartmentRaw) ? Number(apartmentRaw) : null;

  const data = await createDesign({
    project_id: Number(args.backendProjectId),
    layout_code: args.layoutCode,
    apartment_id: apartmentId,
    source_design_code: null,
  });

  saveDraft({
    version: 3,
    streamProjectId: args.streamProjectId,
    projectId: args.backendProjectId,
    layoutCode: args.layoutCode,
    apartmentId: args.apartmentId ?? null,
    designCode: data.design_code,
    selections: draft?.selections ?? [],
    selectionRevision: 0,
    summaryToken: draft?.summaryToken ?? null,
    summaryExpiresAt: draft?.summaryExpiresAt ?? null,
    prepareIdempotencyKey:
      draft?.prepareIdempotencyKey ?? draft?.retryIdempotencyKey ?? null,
    retryIdempotencyKey:
      draft?.prepareIdempotencyKey ?? draft?.retryIdempotencyKey ?? null,
    highResCaptureSent: false,
    updatedAt: new Date().toISOString(),
  });

  return { designCode: data.design_code, returning: false };
}

export async function createReplacementDesign(args: {
  streamProjectId: string;
  backendProjectId: string;
  layoutCode: string;
  apartmentId?: string | null;
  sourceDesignCode?: string | null;
  selections?: import("@/types/stored-selection").StoredSelection[];
}): Promise<string> {
  if (!isBackendProjectId(args.backendProjectId)) {
    throw new Error("A valid project is required to create a design.");
  }

  clearDraft(
    args.streamProjectId,
    args.backendProjectId,
    args.layoutCode,
    args.apartmentId,
  );

  const apartmentRaw = args.apartmentId?.trim();
  const apartmentId =
    apartmentRaw && /^\d+$/.test(apartmentRaw) ? Number(apartmentRaw) : null;

  const data = await createDesign({
    project_id: Number(args.backendProjectId),
    layout_code: args.layoutCode,
    apartment_id: apartmentId,
    source_design_code: args.sourceDesignCode?.trim() || null,
  });

  saveDraft({
    version: 3,
    streamProjectId: args.streamProjectId,
    projectId: args.backendProjectId,
    layoutCode: args.layoutCode,
    apartmentId: args.apartmentId ?? null,
    designCode: data.design_code,
    selections: args.selections ?? [],
    selectionRevision: 0,
    summaryToken: null,
    summaryExpiresAt: null,
    prepareIdempotencyKey: null,
    retryIdempotencyKey: null,
    highResCaptureSent: false,
    updatedAt: new Date().toISOString(),
  });

  return data.design_code;
}
