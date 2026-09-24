import { createDesign } from "@/services/create-design.service";
import { getDesignConfiguration } from "@/services/get-design-configuration.service";
import {
  postDesignSummary,
  type DesignSummaryData,
} from "@/services/post-design-summary.service";
import { clearDraftsForLayout, saveDraft } from "@/lib/configurator/storage";
import { isBackendProjectId } from "@/lib/projects/project-id";
import type { StoredSelection } from "@/types/stored-selection";
import { apiErrorMessage } from "@/lib/api-error";

export type CloneQuotationDesignArgs = {
  sourceDesignCode: string;
  streamProjectId: string;
  backendProjectId: string;
  layoutCode: string;
  apartmentId?: string | null;
  /** When true, send keep_customizations: 1. Otherwise omit the field. */
  keepCustomizations?: boolean;
  /** GET source configuration (no defaults) and store as the local draft. */
  persistLocalSelections?: boolean;
  /** GET source configuration with defaults and POST summary on the new code. */
  postSummary?: boolean;
};

export type CloneQuotationDesignResult =
  | {
      ok: true;
      designCode: string;
      customSelections: StoredSelection[];
      allSelections: StoredSelection[];
      summary: DesignSummaryData | null;
    }
  | { ok: false; message: string };

function apartmentIdNumber(raw?: string | null): number | null {
  const value = raw?.trim();
  return value && /^\d+$/.test(value) ? Number(value) : null;
}

export async function cloneQuotationDesign(
  args: CloneQuotationDesignArgs,
): Promise<CloneQuotationDesignResult> {
  if (!isBackendProjectId(args.backendProjectId)) {
    return { ok: false, message: "A valid project is required." };
  }
  const source = args.sourceDesignCode.trim();
  if (!source) return { ok: false, message: "Missing source design code." };

  const persistLocalSelections = args.persistLocalSelections !== false;
  const postSummary = args.postSummary !== false;

  try {
    const custom = persistLocalSelections
      ? await getDesignConfiguration(source)
      : { ok: true as const, selections: [] as StoredSelection[] };
    if (!custom.ok) {
      return {
        ok: false,
        message:
          custom.reason === "not_found"
            ? "Saved choices for this design could not be found."
            : custom.message,
      };
    }

    const withDefaults = postSummary
      ? await getDesignConfiguration(source, { includeDefaults: true })
      : custom;
    if (!withDefaults.ok) {
      return {
        ok: false,
        message:
          withDefaults.reason === "not_found"
            ? "Saved choices for this design could not be found."
            : withDefaults.message,
      };
    }

    const created = await createDesign({
      project_id: Number(args.backendProjectId),
      layout_code: args.layoutCode,
      apartment_id: apartmentIdNumber(args.apartmentId),
      source_design_code: source,
      ...(args.keepCustomizations ? { keep_customizations: 1 as const } : {}),
    });
    const designCode = created.design_code?.trim();
    if (!designCode) {
      return { ok: false, message: "The server did not return a design code." };
    }

    const summary = postSummary
      ? await postDesignSummary(designCode, {
          selection_revision: 0,
          selections: withDefaults.selections,
        })
      : null;

    if (persistLocalSelections) {
      clearDraftsForLayout(
        args.streamProjectId,
        args.backendProjectId,
        args.layoutCode,
      );
      saveDraft({
        version: 3,
        streamProjectId: args.streamProjectId,
        projectId: args.backendProjectId,
        layoutCode: args.layoutCode,
        apartmentId: args.apartmentId ?? null,
        designCode,
        selections: custom.selections,
        selectionRevision: 0,
        summaryToken: summary?.summary_token ?? null,
        summaryExpiresAt: summary?.summary_expires_at ?? null,
        prepareIdempotencyKey: null,
        retryIdempotencyKey: null,
        highResCaptureSent: false,
        updatedAt: new Date().toISOString(),
      });
    }

    return {
      ok: true,
      designCode,
      customSelections: custom.selections,
      allSelections: withDefaults.selections,
      summary,
    };
  } catch (err) {
    return {
      ok: false,
      message: apiErrorMessage(
        err,
        "Could not copy this design. Please try again.",
      ),
    };
  }
}
