import apiClient from "@/lib/axios";
import type { AxiosResponse } from "axios";
import { ENDPOINTS } from "@/lib/endpoints";

export type TApartmentSearchItem = {
  id: number;
  apartment_number: string;
  layout: {
    id: number;
    code: string;
    category: { id: number; name: string };
    type: { id: number; name: string };
    area: string;
  };
};

export type TApartmentSearchResponse = {
  message: string;
  data: TApartmentSearchItem[];
  pagination: {
    current_page: number;
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
  };
};

export async function searchApartments(
  projectId: number,
  apartmentNumber: string,
  page = 1,
): Promise<TApartmentSearchResponse> {
  const response: AxiosResponse<TApartmentSearchResponse> = await apiClient.get(
    ENDPOINTS.SEARCH_APARTMENTS,
    {
      params: {
        project_id: projectId,
        apartment_number: apartmentNumber,
        page,
      },
    },
  );
  return response.data;
}
