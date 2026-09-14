import apiClient from "@/lib/axios";
import { ENDPOINTS } from "@/lib/endpoints";
import type { StoredSelection } from "@/types/stored-selection";
import type { AxiosResponse } from "axios";

export type PrepareRendersBody = {
  selection_revision: number;
  summary_token: string;
  selections: StoredSelection[];
};

export type PrepareRendersData = {
  replayed: boolean;
  design_code: string;
  selection_revision: number;
  is_locked: boolean;
  priced_at: string;
  expires_at: string;
  confirmed_at: string | null;
  expected_targets: {
    camera_zone_id: string;
    camera_id: string;
    status: string;
  }[];
};

export async function prepareRenders(
  designCode: string,
  body: PrepareRendersBody,
  idempotencyKey: string,
) {
  const response: AxiosResponse<{ message: string; data: PrepareRendersData }> =
    await apiClient.post(ENDPOINTS.PREPARE_RENDERS(designCode), body, {
      headers: { "X-Idempotency-Key": idempotencyKey },
    });
  return response.data.data;
}

export type RenderCameraStatus = {
  camera_zone_id: string;
  camera_id: string;
  status: string;
  render_s3_url: string | null;
  is_failed: boolean;
  can_retry: boolean;
  error_code: string | null;
  attempt_number: number;
};

export type GetRendersData = {
  design_code: string;
  status: string;
  is_all_rendered: boolean;
  is_terminal: boolean;
  is_expired: boolean;
  ue_status: string | null;
  is_ue_failed: boolean | null;
  expected_count: number;
  completed_count: number;
  failed_count: number;
  pending_count: number;
  poll_after_ms: number;
  cameras: RenderCameraStatus[];
};

export async function getRenders(designCode: string) {
  const response: AxiosResponse<{ message: string; data: GetRendersData }> =
    await apiClient.get(ENDPOINTS.GET_RENDERS(designCode));
  return response.data.data;
}

export type RetryRenderCamera = {
  camera_zone_id: string;
  camera_id: string;
};

export async function retryRenders(
  designCode: string,
  cameras: RetryRenderCamera[],
  idempotencyKey: string,
) {
  const response: AxiosResponse<{ message: string; data?: unknown }> =
    await apiClient.post(
      ENDPOINTS.RENDER_RETRIES(designCode),
      { cameras },
      { headers: { "X-Idempotency-Key": idempotencyKey } },
    );
  return response.data;
}
