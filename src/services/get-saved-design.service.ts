import apiClient from "@/lib/axios";
import { ENDPOINTS } from "@/lib/endpoints";
import { normalizeQuotationDesignCode } from "@/lib/quotation/design-code";
import { isAxiosError } from "axios";
import type { AxiosResponse } from "axios";

export type SavedDesignApartment = {
  id: number;
  apartment_number: string;
} | null;

export type SavedDesignData = {
  design_code: string;
  /** Catalog/schema mismatch. `true` means the design cannot be consumed or viewed. */
  is_invalid: boolean;
  quotation: {
    priced_at: string;
    expires_at: string;
    is_expired: boolean;
    total_amount: string;
    pdf_url?: string | null;
    pdf_status?: string | null;
  };
  pdf_url?: string | null;
  property: {
    project: {
      id: number;
      code: string;
      name: string;
      handover: string;
      streampixel_app_id: string;
    };
    category: {
      code: string;
      display_name: string;
    };
    unit_type: {
      code: string;
      display_name: string;
    };
    layout: {
      code: string;
      area_sqft: string;
      display_name: string;
    };
    apartment: SavedDesignApartment;
  };
  preview_url: string | null;
};

export type GetSavedDesignResult =
  | { ok: true; data: SavedDesignData }
  | { ok: false; reason: "not_found" | "failed"; message: string };

type SavedDesignResponse = {
  message: string;
  data?: Omit<SavedDesignData, "is_invalid"> & { is_invalid?: boolean };
};

export async function getSavedDesign(
  designCode: string,
): Promise<GetSavedDesignResult> {
  const code = normalizeQuotationDesignCode(designCode);

  try {
    const response: AxiosResponse<SavedDesignResponse> = await apiClient.get(
      ENDPOINTS.GET_DESIGN(code),
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
    const payload = response.data?.data;
    const message = response.data?.message || "Failed to load saved design.";
    if (!payload?.design_code) {
      return {
        ok: false,
        reason: isNotFoundMessage(message) ? "not_found" : "failed",
        message,
      };
    }
    return {
      ok: true,
      data: {
        ...payload,
        is_invalid: payload.is_invalid === true,
      },
    };
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 404) {
      const message =
        typeof err.response.data?.message === "string"
          ? err.response.data.message
          : "Not found.";
      return { ok: false, reason: "not_found", message };
    }
    return {
      ok: false,
      reason: "failed",
      message: "Failed to load saved design.",
    };
  }
}

function isNotFoundMessage(message?: string): boolean {
  const text = message?.trim().toLowerCase() ?? "";
  return text === "not found." || text === "not found";
}

export function isSavedDesignInvalid(data: SavedDesignData): boolean {
  return data.is_invalid === true;
}

export function isSavedDesignValid(data: SavedDesignData): boolean {
  return !isSavedDesignInvalid(data);
}

export function savedDesignPdfUrl(data: SavedDesignData): string | null {
  const direct = data.pdf_url?.trim();
  if (direct) return direct;
  const nested = data.quotation.pdf_url?.trim();
  return nested || null;
}
