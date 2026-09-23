import apiClient from "@/lib/axios";
import { ENDPOINTS } from "@/lib/endpoints";
import { getValidJourneyToken } from "@/lib/journey";
import { isAxiosError } from "axios";
import type { AxiosResponse } from "axios";

export type ConfirmDesignData = {
  design_code: string;
  confirmed_at: string;
  expires_at: string;
  is_expired: boolean;
  pdf_status: string;
  email_status: string;
};

type ConfirmDesignResponse = {
  message: string;
  data?: ConfirmDesignData;
};

export type ConfirmDesignResult =
  | { ok: true; data: ConfirmDesignData }
  | { ok: false; message: string };

function apiMessage(err: unknown, fallback: string) {
  if (isAxiosError(err)) {
    const body = err.response?.data as { message?: string } | undefined;
    if (typeof body?.message === "string" && body.message.trim()) {
      return body.message;
    }
    if (err.response?.status === 401) {
      return "Your session expired. Please start again to confirm this design.";
    }
    return err.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
}

export async function confirmDesign(
  designCode: string,
): Promise<ConfirmDesignResult> {
  const code = designCode.trim();
  if (!code) {
    return { ok: false, message: "Missing design code." };
  }
  if (!getValidJourneyToken()) {
    return {
      ok: false,
      message: "Your session expired. Please start again to confirm this design.",
    };
  }

  try {
    const response: AxiosResponse<ConfirmDesignResponse> = await apiClient.post(
      ENDPOINTS.CONFIRM_DESIGN(code),
    );
    if (!response.data?.data?.design_code) {
      return {
        ok: false,
        message: response.data?.message || "Failed to confirm this design.",
      };
    }
    return { ok: true, data: response.data.data };
  } catch (err) {
    return { ok: false, message: apiMessage(err, "Failed to confirm this design.") };
  }
}
