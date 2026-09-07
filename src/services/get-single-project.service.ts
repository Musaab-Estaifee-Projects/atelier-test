import apiClient from "@/lib/axios";
import type { AxiosResponse } from "axios";
import { ENDPOINTS } from "@/lib/endpoints";
import { TProject } from "@/types/types";

export type TProjectDetailResponse = {
  message: string;
  data: TProject;
};

export async function getSingleProject(code: string): Promise<TProject> {
  const response: AxiosResponse<TProjectDetailResponse> = await apiClient.get(
    ENDPOINTS.GET_SINGLE_PROJECT(code),
  );
  return response.data.data;
}
