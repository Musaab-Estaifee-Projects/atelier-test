import axios, { type AxiosError } from "axios";
import { getValidJourneyToken } from "@/lib/journey";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// apiClient.interceptors.request.use((config) => {
//   const url = `${config.baseURL ?? ""}${config.url ?? ""}`;
//   const isCreateCustomer =
//     (config.method ?? "get").toLowerCase() === "post" &&
//     url.includes("/customers");
//   if (isCreateCustomer) return config;
//   const token = getValidJourneyToken();
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

apiClient.interceptors.request.use((config) => {
  const method = (config.method ?? "get").toLowerCase();
  const path = String(config.url ?? "").split("?")[0];
  const isCreateCustomer = method === "post" && path.includes("/customers");
  const isPublicGetDesign =
    method === "get" && /^\/designs\/[^/]+\/?$/.test(path);
  const isPublicGetDesignConfiguration =
    method === "get" && /^\/designs\/[^/]+\/configuration\/?$/.test(path);
  if (isCreateCustomer || isPublicGetDesign || isPublicGetDesignConfiguration) {
    return config;
  }
  const token = getValidJourneyToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

export default apiClient;
