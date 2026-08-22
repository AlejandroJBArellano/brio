import { z } from "zod";

/**
 * Strict runtime schema for Brio's environment configuration.
 */
export const envSchema = z.object({
  HABITICA_USER_ID: z.string().min(1, "HABITICA_USER_ID is required").optional(),
  HABITICA_API_KEY: z.string().min(1, "HABITICA_API_KEY is required").optional(),
  HABITICA_BASE_URL: z
    .string()
    .url("HABITICA_BASE_URL must be a valid URL")
    .default("https://habitica.com/api/v3"),
  DATABASE_URL: z.string().optional(),
  GOOGLE_CALENDAR_ICAL_URL: z.string().optional(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

/**
 * Returns validated environment variables.
 */
export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const result = envSchema.safeParse({
    HABITICA_USER_ID: process.env.HABITICA_USER_ID,
    HABITICA_API_KEY: process.env.HABITICA_API_KEY,
    HABITICA_BASE_URL:
      process.env.HABITICA_BASE_URL || "https://habitica.com/api/v3",
    DATABASE_URL: process.env.DATABASE_URL,
    GOOGLE_CALENDAR_ICAL_URL: process.env.GOOGLE_CALENDAR_ICAL_URL,
    NODE_ENV: process.env.NODE_ENV || "development",
  });

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new Error(
      `[Brio Environment Error] Missing or invalid configuration: ${errorDetails}. Please check your .env.local file.`
    );
  }

  cachedEnv = result.data;
  return cachedEnv;
}

/**
 * Non-throwing helper to check if Habitica credentials are provided.
 */
export function isHabiticaConfigured(): boolean {
  return (
    Boolean(process.env.HABITICA_USER_ID) && Boolean(process.env.HABITICA_API_KEY)
  );
}

/**
 * Helper to check if Database is configured.
 */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
