import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { env } from "@/lib/env";
import { getValidJourneyToken } from "@/lib/journey";

const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/** Endpoints the backend serves without a journey token. */
export function isPublicEndpoint(
  method: string | undefined,
  url: string | undefined,
): boolean {
  const m = (method ?? "get").toLowerCase();
  const path = String(url ?? "").split("?")[0];
  if (m === "post" && /^\/customers\/?$/.test(path)) return true;
  if (m !== "get") return false;
  return (
    /^\/designs\/[^/]+\/?$/.test(path) ||
    /^\/designs\/[^/]+\/configuration\/?$/.test(path)
  );
}

export function attachJourneyToken(
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig {
  if (isPublicEndpoint(config.method, config.url)) return config;
  const token = getValidJourneyToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

apiClient.interceptors.request.use(attachJourneyToken);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

export default apiClient;
