import { z } from "zod";

/**
 * Strict runtime schema for Brio's environment configuration.
 */
export const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
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
    DATABASE_URL: process.env.DATABASE_URL,
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
 * Helper to check if Database is configured.
 */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
