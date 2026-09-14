import apiClient from "@/lib/axios";
import { ENDPOINTS } from "@/lib/endpoints";
import type { AxiosResponse } from "axios";

export type CreateCustomerBody = {
  full_name: string;
  email: string;
  phone: string;
  customer_type: string;
};

export type CreateCustomerResponse = {
  message: string;
  data: {
    customer: CreateCustomerBody;
    journey_token: string;
    expires_at: string;
  };
};

export async function createCustomer(body: CreateCustomerBody) {
  const response: AxiosResponse<CreateCustomerResponse> = await apiClient.post(
    ENDPOINTS.CREATE_CUSTOMER,
    body,
  );
  return response.data.data;
}
