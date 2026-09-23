import apiClient from "@/lib/axios";
import { ENDPOINTS } from "@/lib/endpoints";
import { normalizeQuotationDesignCode } from "@/lib/quotation/design-code";
import { normalizeStoredSelections } from "@/lib/configurator/api-selections";
import type { StoredSelection } from "@/types/stored-selection";
import { isAxiosError } from "axios";
import type { AxiosResponse } from "axios";

export type DesignConfigurationProperty = {
  project_code?: string;
  layout_code?: string;
  apartment_number?: string | null;
  streampixel_app_id?: string;
};

export type DesignConfigurationData = {
  design_code: string;
  is_expired?: boolean;
  property?: DesignConfigurationProperty;
  selections: StoredSelection[];
};

type DesignConfigurationResponse = {
  message?: string;
  data?: DesignConfigurationData;
};

export type GetDesignConfigurationResult =
  | { ok: true; data: DesignConfigurationData; selections: StoredSelection[] }
  | { ok: false; reason: "not_found" | "failed"; message: string };

function isNotFoundMessage(message?: string): boolean {
  const text = message?.trim().toLowerCase() ?? "";
  return text === "not found." || text === "not found";
}

export async function getDesignConfiguration(
  designCode: string,
  opts?: { includeDefaults?: boolean },
): Promise<GetDesignConfigurationResult> {
  const code = normalizeQuotationDesignCode(designCode);
  try {
    const response: AxiosResponse<DesignConfigurationResponse> =
      await apiClient.get(ENDPOINTS.GET_DESIGN_CONFIGURATION(code), {
        params: opts?.includeDefaults ? { include_defaults: true } : undefined,
        headers: { "Cache-Control": "no-store" },
      });

    const message =
      typeof response.data?.message === "string" ? response.data.message : "";
    if (response.status === 404 || isNotFoundMessage(message)) {
      return {
        ok: false,
        reason: "not_found",
        message: message || "Not found.",
      };
    }

    const payload = response.data?.data;
    if (!payload || typeof payload !== "object") {
      return {
        ok: false,
        reason: "failed",
        message: message || "Failed to load design configuration.",
      };
    }

    const selections = normalizeStoredSelections(payload.selections);
    return {
      ok: true,
      data: {
        design_code: payload.design_code || code,
        is_expired: payload.is_expired,
        property: payload.property,
        selections,
      },
      selections,
    };
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 404) {
      const message =
        typeof err.response.data?.message === "string"
          ? err.response.data.message
          : "Not found.";
      return { ok: false, reason: "not_found", message };
    }
    const message = isAxiosError(err)
      ? String(
          (err.response?.data as { message?: string } | undefined)?.message ||
            err.message ||
            "Failed to load design configuration.",
        )
      : "Failed to load design configuration.";
    return { ok: false, reason: "failed", message };
  }
}
