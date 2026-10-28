import { cache } from "react";
import { cookies, headers } from "next/headers";
import crypto from "crypto";

export const AUTH_COOKIE_NAME = "brio_auth_session";

export interface OwnerSession {
  isAuthenticated: boolean;
  user?: { email: string; name: string };
}

export interface SessionTokenPayload {
  email: string;
  name?: string;
  createdAt: number;
  exp?: number;
}

/**
 * Retrieves the cryptographic secret used to sign session cookies.
 */
export function getAuthSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET || process.env.BRIO_CIPHER_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Missing BETTER_AUTH_SECRET in environment variables.");
    }
    return "brio_dev_insecure_local_secret_only";
  }
  return secret;
}

/**
 * Creates an HMAC-signed session token in the format: <payloadBase64>.<signatureHex>
 */
export function createSignedSessionToken(payload: SessionTokenPayload): string {
  const secret = getAuthSecret();
  const payloadBase64 = Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(payloadBase64).digest("hex");
  return `${payloadBase64}.${signature}`;
}

/**
 * Verifies an HMAC-signed session token and returns the payload if valid.
 */
export function verifySignedSessionToken(token: string): SessionTokenPayload | null {
  try {
    if (!token || typeof token !== "string") return null;

    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payloadBase64, providedSigHex] = parts;
    const secret = getAuthSecret();
    const expectedSigHex = crypto.createHmac("sha256", secret).update(payloadBase64).digest("hex");

    const providedBuf = Buffer.from(providedSigHex, "hex");
    const expectedBuf = Buffer.from(expectedSigHex, "hex");

    if (providedBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(providedBuf, expectedBuf)) return null;

    const jsonStr = Buffer.from(payloadBase64, "base64url").toString("utf-8");
    const payload = JSON.parse(jsonStr) as SessionTokenPayload;

    if (!payload.email || typeof payload.email !== "string") return null;
    if (payload.exp && Date.now() > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Deduplicated server-side owner session verification per request.
 */
export const getCachedOwnerSession = cache(async (): Promise<OwnerSession> => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return { isAuthenticated: false };
    }

    const payload = verifySignedSessionToken(token);
    if (!payload) {
      return { isAuthenticated: false };
    }

    return {
      isAuthenticated: true,
      user: {
        email: payload.email,
        name: payload.name || "Alejandro Arellano",
      },
    };
  } catch {
    return { isAuthenticated: false };
  }
});

/**
 * Requires an authenticated owner session or valid Bearer agent token.
 * Throws an error if unauthenticated.
 * Call this at the entry point of all sensitive server actions and routes.
 */
export async function requireAuth(): Promise<OwnerSession> {
  const session = await getCachedOwnerSession();
  if (session.isAuthenticated) {
    return session;
  }

  // Also check if request carries a valid Bearer token for automated agent/MCP access
  try {
    const reqHeaders = await headers();
    const authHeader = reqHeaders.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      const expectedToken = process.env.BRIO_AGENT_TOKEN;
      if (expectedToken && token) {
        const tokenBuf = Buffer.from(token);
        const expectedBuf = Buffer.from(expectedToken);
        if (
          tokenBuf.length === expectedBuf.length &&
          crypto.timingSafeEqual(tokenBuf, expectedBuf)
        ) {
          return {
            isAuthenticated: true,
            user: {
              email: "agent@brio.local",
              name: "Brio Agent",
            },
          };
        }
      }
    }
  } catch {
    // headers() might not be available or throw in non-request contexts
  }

  throw new Error("No autorizado: Sesión requerida");
}
