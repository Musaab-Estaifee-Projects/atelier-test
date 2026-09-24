"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { hasDraftForLayout } from "@/lib/configurator/storage";
import {
  configuratorResumeHref,
  writeQuotationResume,
  type QuotationResumeMode,
} from "@/lib/quotation/resume-intent";
import { quotationKeepPath } from "@/lib/quotation/share-url";
import {
  isSavedDesignValid,
  savedDesignPdfUrl,
  type SavedDesignData,
} from "@/services/get-saved-design.service";

export type QuotationAction =
  | "download"
  | "walk"
  | "edit"
  | "keep"
  | "fresh";

function resumeFromDesign(
  data: SavedDesignData,
  mode: QuotationResumeMode,
  clonedDesignCode?: string | null,
) {
  return {
    sourceDesignCode: data.design_code,
    streamProjectId: data.property.project.streampixel_app_id,
    projectId: String(data.property.project.id),
    layoutCode: data.property.layout.code,
    apartmentId:
      data.property.apartment?.id != null
        ? String(data.property.apartment.id)
        : null,
    apartmentNumber: data.property.apartment?.apartment_number ?? null,
    mode,
    clonedDesignCode: clonedDesignCode ?? null,
  };
}

export function useQuotationActions(data: SavedDesignData) {
  const router = useRouter();
  const expired = Boolean(data.quotation.is_expired);
  const valid = isSavedDesignValid(data);
  const pdfUrl = savedDesignPdfUrl(data);
  const [pending, setPending] = useState<QuotationAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [overrideAction, setOverrideAction] = useState<QuotationAction | null>(
    null,
  );
  const [expiredDialogOpen, setExpiredDialogOpen] = useState(false);

  const needsOverride = (action: QuotationAction) => {
    if (action === "download" || action === "walk" || action === "keep") {
      return false;
    }
    return hasDraftForLayout(
      data.property.project.streampixel_app_id,
      String(data.property.project.id),
      data.property.layout.code,
    );
  };

  const openConfigurator = (
    streamId: string,
    projectId: string,
    layoutCode: string,
    apartmentId: string | null,
    apartmentNumber: string | null,
    opts: { view?: boolean },
  ) => {
    router.push(
      configuratorResumeHref({
        streamProjectId: streamId,
        projectId,
        layoutCode,
        apartmentId,
        apartmentNumber,
        view: opts.view,
      }),
    );
  };

  const run = async (action: QuotationAction) => {
    setError(null);
    const streamId = data.property.project.streampixel_app_id?.trim();
    const projectId = String(data.property.project.id);
    const layoutCode = data.property.layout.code;
    if (action === "download") {
      if (!pdfUrl) {
        setError("The PDF quotation is not available yet.");
        return;
      }
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (action === "keep") {
      setPending("keep");
      router.push(quotationKeepPath(data.design_code));
      return;
    }

    if (!streamId || !projectId || !layoutCode) {
      setError("This quotation is missing project details.");
      return;
    }

    const apartmentId =
      data.property.apartment?.id != null
        ? String(data.property.apartment.id)
        : null;
    const apartmentNumber = data.property.apartment?.apartment_number ?? null;

    if (action === "walk") {
      writeQuotationResume(resumeFromDesign(data, "view"));
      setPending("walk");
      openConfigurator(
        streamId,
        projectId,
        layoutCode,
        apartmentId,
        apartmentNumber,
        {
          view: true,
        },
      );
      return;
    }

    const mode: QuotationResumeMode = action === "fresh" ? "fresh" : "edit";

    writeQuotationResume(resumeFromDesign(data, mode));
    setPending(action);
    openConfigurator(
      streamId,
      projectId,
      layoutCode,
      apartmentId,
      apartmentNumber,
      { view: false },
    );
  };

  const request = (action: QuotationAction) => {
    setError(null);
    if (needsOverride(action)) {
      setOverrideAction(action);
      return;
    }
    void run(action);
  };

  return {
    expired,
    valid,
    pdfUrl,
    pending,
    error,
    overrideOpen: overrideAction != null,
    expiredDialogOpen,
    setExpiredDialogOpen,
    request,
    confirmOverride: () => {
      if (!overrideAction) return;
      const action = overrideAction;
      setOverrideAction(null);
      void run(action);
    },
    cancelOverride: () => setOverrideAction(null),
  };
}
