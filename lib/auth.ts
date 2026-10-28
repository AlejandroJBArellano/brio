import { betterAuth } from "better-auth";
import { Pool } from "pg";
import crypto from "crypto";

const devFallbackSecret = crypto.randomBytes(32).toString("hex");
const authSecret = process.env.BETTER_AUTH_SECRET || (process.env.NODE_ENV === "production" ? undefined : devFallbackSecret);
if (!authSecret) {
  throw new Error("Missing BETTER_AUTH_SECRET in environment variables.");
}

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  secret: authSecret,
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL,
  trustedOrigins: [
    "http://localhost:3000",
    "https://brio-sand.vercel.app",
  ],
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    disableSignUp: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});
