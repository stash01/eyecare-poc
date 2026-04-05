import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { setSessionCookie } from "@/lib/server/session";
import { clearProviderSessionCookie } from "@/lib/server/provider-session";

export const dynamic = "force-dynamic";

const RESTORE_COOKIE = "klaramd_admin_restore";

// POST /api/admin/impersonate/return
export async function POST() {
  const restoreToken = cookies().get(RESTORE_COOKIE)?.value;
  if (!restoreToken) {
    return NextResponse.json({ error: "No active impersonation session" }, { status: 400 });
  }

  // Restore admin session
  setSessionCookie(restoreToken);

  // Clear provider session if one exists
  clearProviderSessionCookie();

  // Clear restore cookie
  cookies().set(RESTORE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return NextResponse.json({ ok: true, redirectTo: "/admin" });
}
