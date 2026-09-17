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
  quotation: {
    priced_at: string;
    expires_at: string;
    is_expired: boolean;
    total_amount: string;
  };
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
  data?: SavedDesignData;
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
    if (!response.data?.data) {
      return {
        ok: false,
        reason: "failed",
        message: response.data?.message || "Failed to load saved design.",
      };
    }
    return { ok: true, data: response.data.data };
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
