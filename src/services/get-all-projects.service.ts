import apiClient from "@/lib/axios";
import type { AxiosResponse } from "axios";
import { ENDPOINTS } from "@/lib/endpoints";
import { TProject } from "@/types/types";

export type TProjectsResponse = {
  message: string;
  data: TProject[];
};

export async function getAllProjects(): Promise<TProject[]> {
  const response: AxiosResponse<TProjectsResponse> = await apiClient.get(
    ENDPOINTS.GET_ALL_PROJECTS,
  );
  return response.data.data;
}

// export const PROJECTS_QUERY_KEY = ["projects"] as const;

// export const getAllProjects = () => {
//   return apiClient.get<TProjectsResponse>(ENDPOINTS.GET_ALL_PROJECTS);
// };

// export const useGetAllProjects = () => {
//   return useQuery({
//     queryKey: PROJECTS_QUERY_KEY,
//     queryFn: getAllProjects,
//     select: (response: AxiosResponse<TProjectsResponse>) => response.data.data,
//     refetchOnReconnect: "always",
//   });
// };
