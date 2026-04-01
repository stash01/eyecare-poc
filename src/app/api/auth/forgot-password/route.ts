import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/server/db";
import { sendPasswordResetEmail } from "@/lib/server/email";

export const dynamic = "force-dynamic";

const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    // Always return 200 — never reveal whether an account exists
    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: true });
    }

    const emailLower = email.toLowerCase().trim();

    const { data: patient } = await db
      .from("patients")
      .select("id, first_name, email")
      .eq("email", emailLower)
      .single();

    if (!patient) {
      return NextResponse.json({ success: true });
    }

    // Invalidate any existing unused reset tokens for this patient
    await db
      .from("password_reset_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("patient_id", patient.id)
      .is("used_at", null);

    // Create a new token
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS).toISOString();

    await db.from("password_reset_tokens").insert({
      patient_id: patient.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    try {
      await sendPasswordResetEmail(patient.email, patient.first_name, rawToken);
    } catch (emailErr) {
      console.error("[forgot-password] Email send failed:", emailErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[forgot-password] Unexpected error:", err);
    return NextResponse.json({ success: true }); // Always 200
  }
}
