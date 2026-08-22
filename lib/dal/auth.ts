import { cache } from "react";
import { cookies } from "next/headers";

const AUTH_COOKIE_NAME = "brio_auth_session";

export interface OwnerSession {
  isAuthenticated: boolean;
  user?: { email: string; name: string };
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

    const payload = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    if (!payload.email) {
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
