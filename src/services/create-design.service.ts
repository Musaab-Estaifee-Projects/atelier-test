import apiClient from "@/lib/axios";
import { ENDPOINTS } from "@/lib/endpoints";
import type { AxiosResponse } from "axios";

export type CreateDesignBody = {
  project_id: number | string;
  layout_code: string;
  apartment_id: number | string | null;
  source_design_code: string | null;
  keep_customizations?: 0 | 1;
};

export type CreateDesignData = {
  design_code: string;
  creation_reason: string;
  project_id: number;
  layout_code: string;
  selection_revision: number;
  journey_stage: string;
  is_locked: boolean;
  last_activity_at: string;
};

export async function createDesign(body: CreateDesignBody) {
  const response: AxiosResponse<{ message: string; data: CreateDesignData }> =
    await apiClient.post(ENDPOINTS.CREATE_DESIGN, body);
  return response.data.data;
}
