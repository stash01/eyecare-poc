import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";
import { createSession, setSessionCookie } from "@/lib/server/session";
import { logAuditEvent } from "@/lib/server/audit";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();
    const ipAddress = getClientIp(req);

    // ── Check recent failed attempts (simple rate limiting) ─────────────────
    const lockoutWindow = new Date(
      Date.now() - LOCKOUT_MINUTES * 60 * 1000
    ).toISOString();

    const { count: failCount } = await db
      .from("audit_log")
      .select("id", { count: "exact", head: true })
      .eq("action", "login_failed")
      .eq("ip_address", ipAddress)
      .gte("created_at", lockoutWindow);

    if ((failCount ?? 0) >= MAX_ATTEMPTS) {
      return NextResponse.json(
        {
          error: `Too many failed attempts. Please try again in ${LOCKOUT_MINUTES} minutes.`,
        },
        { status: 429 }
      );
    }

    // ── Look up patient ─────────────────────────────────────────────────────
    const { data: patient } = await db
      .from("patients")
      .select("id, email, first_name, last_name, password_hash, email_verified")
      .eq("email", emailLower)
      .single();

    // ── Verify password (constant-time comparison via bcrypt) ───────────────
    // Always run bcrypt.compare even when no patient found, to prevent timing attacks.
    const dummyHash =
      "$2a$12$invalidhashfortimingprotectiononly000000000000000000";
    const passwordValid = await bcrypt.compare(
      password,
      patient?.password_hash ?? dummyHash
    );

    if (!patient || !passwordValid) {
      await logAuditEvent(
        "patient",
        null,
        "login_failed",
        "patient",
        null,
        ipAddress,
        { email: emailLower }
      );
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // ── Block unverified accounts ───────────────────────────────────────────
    if (!patient.email_verified) {
      return NextResponse.json(
        {
          error: "Please verify your email address before signing in.",
          emailNotVerified: true,
        },
        { status: 403 }
      );
    }

    // ── Create session ──────────────────────────────────────────────────────
    const token = await createSession(
      {
        patientId: patient.id,
        email: patient.email,
        firstName: patient.first_name,
        lastName: patient.last_name,
      },
      ipAddress
    );

    setSessionCookie(token);

    await logAuditEvent(
      "patient",
      patient.id,
      "login",
      "patient",
      patient.id,
      ipAddress
    );

    return NextResponse.json({
      user: {
        id: patient.id,
        firstName: patient.first_name,
        lastName: patient.last_name,
        email: patient.email,
      },
    });
  } catch (err) {
    console.error("[login] Unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
