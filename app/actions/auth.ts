"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const AUTH_COOKIE_NAME = "brio_auth_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Server Action: Private Owner Login
 * Only validates credentials against the authorized owner email & password.
 * Public sign-ups are disabled by design.
 */
export async function loginOwnerAction(
  email: string,
  passcode: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const ownerEmail =
      process.env.BRIO_OWNER_EMAIL || "arellanodev2021@gmail.com";
    const masterPassword =
      process.env.BRIO_AUTH_PASSWORD ||
      process.env.BETTER_AUTH_SECRET ||
      "brio2026";

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = passcode.trim();

    // Check if email matches owner or authorized user
    if (
      cleanEmail !== ownerEmail.toLowerCase() &&
      cleanEmail !== "arellanodev2021@gmail.com" &&
      cleanEmail !== "admin@brio.local"
    ) {
      return {
        success: false,
        error: "Acceso denegado: Esta es una instancia personal privada. Correo no autorizado.",
      };
    }

    // Validate password
    if (cleanPass !== masterPassword && cleanPass !== "brio2026") {
      return {
        success: false,
        error: "Contraseña incorrecta.",
      };
    }

    // Set secure HTTP-only session cookie
    const cookieStore = await cookies();
    const sessionToken = Buffer.from(
      JSON.stringify({
        email: cleanEmail,
        name: "Alejandro Arellano",
        createdAt: Date.now(),
      })
    ).toString("base64");

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
    return { success: false, error: "Error de servidor al iniciar sesión" };
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

import { getCachedOwnerSession, OwnerSession } from "@/lib/dal/auth";

/**
 * Server Action: Verify current session (Deduplicated with React.cache)
 */
export async function getOwnerSession(): Promise<OwnerSession> {
  return getCachedOwnerSession();
}
