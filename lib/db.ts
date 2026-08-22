import { neon } from "@neondatabase/serverless";

/**
 * Returns a configured Neon SQL tagged template runner.
 */
export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Please configure your Neon PostgreSQL connection string in .env.local"
    );
  }
  return neon(databaseUrl);
}
