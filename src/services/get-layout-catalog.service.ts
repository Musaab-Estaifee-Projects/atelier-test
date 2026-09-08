import apiClient from "@/lib/axios";
import { ENDPOINTS } from "@/lib/endpoints";
import type {
  LayoutCatalogData,
  LayoutCatalogResponse,
} from "@/types/layout-catalog";
import type { AxiosResponse } from "axios";

export async function getLayoutCatalog(
  layoutCode: string,
  projectId: string,
): Promise<LayoutCatalogData> {
  const response: AxiosResponse<LayoutCatalogResponse> = await apiClient.get(
    ENDPOINTS.GET_LAYOUT_CATALOG(layoutCode),
    { params: { project_id: projectId } },
  );
  return response.data.data;
}
