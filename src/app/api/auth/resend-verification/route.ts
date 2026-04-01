import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/server/db";
import { sendVerificationEmail } from "@/lib/server/email";

export const dynamic = "force-dynamic";

const RESEND_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      // Return 200 to prevent email enumeration
      return NextResponse.json({ success: true });
    }

    const emailLower = email.toLowerCase().trim();

    const { data: patient } = await db
      .from("patients")
      .select("id, first_name, email, email_verified")
      .eq("email", emailLower)
      .single();

    // Always return 200 — don't reveal whether the account exists
    if (!patient || patient.email_verified) {
      return NextResponse.json({ success: true });
    }

    // Rate limit: check for a token created within the last 2 minutes
    const cooldownCutoff = new Date(Date.now() - RESEND_COOLDOWN_MS).toISOString();
    const { data: recentToken } = await db
      .from("email_verification_tokens")
      .select("id")
      .eq("patient_id", patient.id)
      .is("used_at", null)
      .gte("created_at", cooldownCutoff)
      .limit(1)
      .single();

    if (recentToken) {
      // Still within cooldown — silently succeed so the UI can show the message
      return NextResponse.json({ success: true });
    }

    // Invalidate any existing unused tokens for this patient
    await db
      .from("email_verification_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("patient_id", patient.id)
      .is("used_at", null);

    // Create a new token
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS).toISOString();

    await db.from("email_verification_tokens").insert({
      patient_id: patient.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    try {
      await sendVerificationEmail(patient.email, patient.first_name, rawToken);
    } catch (emailErr) {
      console.error("[resend-verification] Email send failed:", emailErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[resend-verification] Unexpected error:", err);
    return NextResponse.json({ success: true }); // Always 200
  }
}
