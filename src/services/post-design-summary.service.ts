import apiClient from "@/lib/axios";
import { ENDPOINTS } from "@/lib/endpoints";
import type { StoredSelection } from "@/types/stored-selection";
import type { AxiosResponse } from "axios";

export type PostDesignSummaryBody = {
  selection_revision: number;
  selections: StoredSelection[];
};

export type SummaryMesh = {
  id: string;
  name: string;
  image?: string | null;
  is_default: boolean;
  unit_price: string;
  amount: string;
};

export type SummaryMaterial = {
  id: string;
  name: string;
  image: string | null;
  is_default: boolean;
  unit_price: string;
  amount: string;
} | null;

export type SummaryCamera = {
  camera_id: string;
  camera_name: string;
  unit: string;
  dimension: string;
  mesh: SummaryMesh | null;
  material: SummaryMaterial;
  line_total: string;
};

export type SummaryZone = {
  camera_zone_id: string;
  camera_zone_name: string;
  cameras: SummaryCamera[];
  total_amount: string;
};

export type DesignSummaryData = {
  design_code: string;
  selection_revision: number;
  currency: string;
  pricing_version: number;
  summary_token: string;
  summary_expires_at: string;
  items: SummaryZone[];
  total_amount: string;
};

export async function postDesignSummary(
  designCode: string,
  body: PostDesignSummaryBody,
) {
  const response: AxiosResponse<{ message: string; data: DesignSummaryData }> =
    await apiClient.post(ENDPOINTS.DESIGN_SUMMARY(designCode), body);
  return response.data.data;
}
