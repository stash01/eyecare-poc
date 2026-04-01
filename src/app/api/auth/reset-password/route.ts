import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/server/db";
import { logAuditEvent } from "@/lib/server/audit";

export const dynamic = "force-dynamic";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");

    const { data: record } = await db
      .from("password_reset_tokens")
      .select("id, patient_id, expires_at, used_at")
      .eq("token_hash", tokenHash)
      .single();

    if (!record) {
      return NextResponse.json(
        { error: "This reset link is invalid or has already been used." },
        { status: 400 }
      );
    }

    if (record.used_at) {
      return NextResponse.json(
        { error: "This reset link has already been used." },
        { status: 400 }
      );
    }

    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date().toISOString();

    // Mark token as used
    await db
      .from("password_reset_tokens")
      .update({ used_at: now })
      .eq("id", record.id);

    // Update password
    await db
      .from("patients")
      .update({ password_hash: passwordHash })
      .eq("id", record.patient_id);

    // Invalidate all active sessions for this patient (force re-login)
    await db
      .from("auth_sessions")
      .delete()
      .eq("patient_id", record.patient_id);

    await logAuditEvent(
      "patient",
      record.patient_id,
      "password_reset",
      "patient",
      record.patient_id,
      getClientIp(req)
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[reset-password] Unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
