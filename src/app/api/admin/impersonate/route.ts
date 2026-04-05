import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateSession, createSession, setSessionCookie, getSessionToken } from "@/lib/server/session";
import { createProviderSession, setProviderSessionCookie } from "@/lib/server/provider-session";
import { db } from "@/lib/server/db";
import { logAuditEvent } from "@/lib/server/audit";
import { getClientIp } from "@/lib/server/request";

export const dynamic = "force-dynamic";

const RESTORE_COOKIE = "klaramd_admin_restore";
const RESTORE_MAX_AGE = 8 * 60 * 60; // 8 hours in seconds

// POST /api/admin/impersonate
export async function POST(req: NextRequest) {
  const session = await validateSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { type, id } = body as { type: "patient" | "provider"; id: string };

  if (!type || !id || !["patient", "provider"].includes(type)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const ip = getClientIp(req);
  const originalToken = getSessionToken();
  if (!originalToken) return NextResponse.json({ error: "No active session" }, { status: 400 });

  let redirectTo: string;
  let displayName: string;

  if (type === "patient") {
    const { data: patient, error } = await db
      .from("patients")
      .select("id, email, first_name, last_name")
      .eq("id", id)
      .single();

    if (error || !patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

    const newToken = await createSession(
      {
        patientId: patient.id,
        email: patient.email,
        firstName: patient.first_name,
        lastName: patient.last_name,
        isAdmin: false,
      },
      ip
    );
    setSessionCookie(newToken);
    displayName = `${patient.first_name} ${patient.last_name}`;
    redirectTo = "/dashboard";
  } else {
    const { data: provider, error } = await db
      .from("providers")
      .select("id, name")
      .eq("id", id)
      .single();

    if (error || !provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

    const newToken = await createProviderSession(provider.id, ip);
    setProviderSessionCookie(newToken);
    displayName = provider.name;
    redirectTo = "/provider";
  }

  // Save admin restore token
  cookies().set(RESTORE_COOKIE, originalToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: RESTORE_MAX_AGE,
    path: "/",
  });

  await logAuditEvent("system", session.patientId, "admin_impersonate", type, id, ip, { type, targetId: id, displayName });

  return NextResponse.json({ ok: true, redirectTo });
}
