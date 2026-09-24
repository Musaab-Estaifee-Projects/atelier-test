import { z } from "zod";

/**
 * Public env vars must be read with static `process.env.NEXT_PUBLIC_*` access —
 * Next.js only inlines those into client bundles; `process.env[key]` is
 * `undefined` in the browser.
 */
const optionalSeconds = z
  .string()
  .optional()
  .transform((raw) => {
    if (raw == null || raw.trim() === "") return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  });

const publicEnvSchema = z.object({
  NEXT_PUBLIC_BASE_URL: z.url({
    message: "NEXT_PUBLIC_BASE_URL must be an absolute API URL",
  }),
  NEXT_PUBLIC_SHOW_DEV_TOOLS: z
    .string()
    .optional()
    .transform((raw) => raw === "true"),
  NEXT_PUBLIC_STREAM_AFK_TIMEOUT: optionalSeconds,
  NEXT_PUBLIC_STREAM_AFK_WARNING: optionalSeconds,
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

function parsePublicEnv(): PublicEnv {
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_SHOW_DEV_TOOLS: process.env.NEXT_PUBLIC_SHOW_DEV_TOOLS,
    NEXT_PUBLIC_STREAM_AFK_TIMEOUT: process.env.NEXT_PUBLIC_STREAM_AFK_TIMEOUT,
    NEXT_PUBLIC_STREAM_AFK_WARNING: process.env.NEXT_PUBLIC_STREAM_AFK_WARNING,
  });
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration — ${issues}`);
  }
  return parsed.data;
}

export const env = parsePublicEnv();
