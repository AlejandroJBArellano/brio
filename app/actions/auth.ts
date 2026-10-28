"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  AUTH_COOKIE_NAME,
  createSignedSessionToken,
  getCachedOwnerSession,
  OwnerSession,
} from "@/lib/dal/auth";

const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Server Action: Private Owner Login
 * Validates credentials strictly against BRIO_OWNER_EMAIL and BRIO_AUTH_PASSWORD.
 */
export async function loginOwnerAction(
  email: string,
  passcode: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const ownerEmail = process.env.BRIO_OWNER_EMAIL?.trim().toLowerCase();
    const masterPassword = process.env.BRIO_AUTH_PASSWORD?.trim();

    if (!masterPassword) {
      console.error("[Login Owner Error]: BRIO_AUTH_PASSWORD no está configurado.");
      return {
        success: false,
        error: "Servidor no configurado.",
      };
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = passcode.trim();

    // Check if email matches configured owner
    if (!ownerEmail || cleanEmail !== ownerEmail) {
      return {
        success: false,
        error: "Correo no autorizado.",
      };
    }

    // Validate password strictly
    if (cleanPass !== masterPassword) {
      return {
        success: false,
        error: "Contraseña incorrecta.",
      };
    }

    // Set cryptographically signed HTTP-only session cookie
    const sessionToken = createSignedSessionToken({
      email: cleanEmail,
      name: "Alejandro Arellano",
      createdAt: Date.now(),
      exp: Date.now() + SESSION_MAX_AGE * 1000,
    });

    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Login Owner Error]:", error);
    return { success: false, error: "Error de servidor al iniciar sesión." };
  }
}

/**
 * Server Action: Logout
 */
export async function logoutOwnerAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  revalidatePath("/");
}

/**
 * Server Action: Verify current session (Deduplicated with React.cache)
 */
export async function getOwnerSession(): Promise<OwnerSession> {
  return getCachedOwnerSession();
}
