import { isAxiosError } from "axios";

export function isDesignFrozenError(error: unknown): boolean {
  if (!isAxiosError(error) || error.response?.status !== 409) return false;
  const body = error.response.data as { message?: string } | undefined;
  const message = (body?.message ?? error.message ?? "").toLowerCase();
  return message.includes("frozen") || message.includes("new design");
}
