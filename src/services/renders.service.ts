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

export type RenderZoneCamera = {
  camera_id: string;
  camera_name: string;
  status: string;
  render_s3_url: string | null;
  is_failed: boolean;
  can_retry: boolean;
  error_code: string | null;
  attempt_number: number;
};

export type RenderCameraZone = {
  camera_zone_id: string;
  camera_zone_name: string;
  cameras: RenderZoneCamera[];
};

export type RenderCameraStatus = RenderZoneCamera & {
  camera_zone_id: string;
  camera_zone_name: string;
};

export type GetRendersData = {
  design_code: string;
  total_amount: string;
  status: string;
  is_all_rendered: boolean;
  is_terminal: boolean;
  is_expired: boolean;
  ue_status: string | null;
  expected_count: number;
  completed_count: number;
  failed_count: number;
  pending_count: number;
  camera_zones: RenderCameraZone[];
};

export function listRenderCameras(
  data: GetRendersData | null | undefined,
): RenderCameraStatus[] {
  if (!data?.camera_zones?.length) return [];
  return data.camera_zones.flatMap((zone) =>
    (zone.cameras ?? []).map((cam) => ({
      ...cam,
      camera_zone_id: zone.camera_zone_id,
      camera_zone_name: zone.camera_zone_name,
    })),
  );
}

export function parseRenderTotalAmount(
  value: string | number | null | undefined,
): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export async function getRenders(designCode: string) {
  const response: AxiosResponse<{ message: string; data: GetRendersData }> =
    await apiClient.get(ENDPOINTS.GET_RENDERS(designCode));
  const data = response.data.data;
  return {
    ...data,
    camera_zones: Array.isArray(data?.camera_zones) ? data.camera_zones : [],
  } satisfies GetRendersData;
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
