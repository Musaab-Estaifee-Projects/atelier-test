import { isAxiosError } from "axios";

/** Human-readable message from an axios/API error, preferring the backend `message`. */
export function apiErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const message = (err.response?.data as { message?: unknown } | undefined)
      ?.message;
    if (typeof message === "string" && message.trim()) return message;
    return err.message || fallback;
  }
  return err instanceof Error && err.message ? err.message : fallback;
}
