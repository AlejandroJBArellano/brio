import { createAuthClient } from "better-auth/react";

/**
 * Better Auth React Client.
 * Automatically targets the same-origin Next.js Route Handler (/api/auth),
 * ensuring zero CORS issues and secure first-party cookie management.
 */
export const authClient = createAuthClient();

export const { signIn, signUp, useSession, signOut } = authClient;
