import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");

    const { data: record } = await db
      .from("email_verification_tokens")
      .select("id, patient_id, expires_at, used_at")
      .eq("token_hash", tokenHash)
      .single();

    if (!record) {
      return NextResponse.json(
        { error: "This verification link is invalid or has already been used." },
        { status: 400 }
      );
    }

    if (record.used_at) {
      return NextResponse.json(
        { error: "This verification link has already been used." },
        { status: 400 }
      );
    }

    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This verification link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Mark token as used and verify the patient's email atomically
    const now = new Date().toISOString();

    await db
      .from("email_verification_tokens")
      .update({ used_at: now })
      .eq("id", record.id);

    await db
      .from("patients")
      .update({ email_verified: true })
      .eq("id", record.patient_id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[verify-email] Unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
