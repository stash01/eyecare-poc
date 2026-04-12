import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/server/db";
import { encryptHealthCard } from "@/lib/server/crypto";
import { logAuditEvent } from "@/lib/server/audit";
import { emr } from "@/lib/server/emr";
import { sendVerificationEmail } from "@/lib/server/email";
import { getClientIp } from "@/lib/server/request";

export const dynamic = "force-dynamic";

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      healthCardNumber,
      password,
      consentPHIPA,
      consentTerms,
    } = body;

    // ── Input validation ────────────────────────────────────────────────────
    if (!firstName || !lastName || !email || !dateOfBirth || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!consentPHIPA || !consentTerms) {
      return NextResponse.json(
        { error: "PHIPA and Terms consents are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();

    // ── Check for existing account ──────────────────────────────────────────
    const { data: existing } = await db
      .from("patients")
      .select("id")
      .eq("email", emailLower)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // ── Hash password (bcrypt cost 12) ──────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, 12);

    // ── Encrypt health card (AES-256-GCM) ──────────────────────────────────
    const encryptedHealthCard =
      healthCardNumber?.trim()
        ? encryptHealthCard(healthCardNumber.trim())
        : null;

    const now = new Date().toISOString();

    // ── Insert patient record ───────────────────────────────────────────────
    const { data: patient, error: insertError } = await db
      .from("patients")
      .insert({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: emailLower,
        phone: phone?.trim() || null,
        date_of_birth: dateOfBirth,
        health_card_number: encryptedHealthCard,
        password_hash: passwordHash,
        consent_phipa: true,
        consent_phipa_timestamp: now,
        consent_terms: true,
        consent_terms_timestamp: now,
        email_verified: false,
      })
      .select("id, first_name, last_name, email")
      .single();

    if (insertError || !patient) {
      console.error("[register] DB insert error:", insertError);
      return NextResponse.json(
        { error: "Registration failed. Please try again." },
        { status: 500 }
      );
    }

    // ── Sync to EMR (no-op in mock mode; will write to real EMR when configured) ─
    try {
      const emrPatientId = await emr.ensurePatient({
        firstName: patient.first_name,
        lastName: patient.last_name,
        email: patient.email,
        dateOfBirth,
        healthCardNumber: healthCardNumber?.trim(),
      });

      if (emrPatientId) {
        await db
          .from("patients")
          .update({ emr_patient_id: emrPatientId })
          .eq("id", patient.id);
      }
    } catch (emrError) {
      console.error("[register] EMR patient sync failed:", emrError);
    }

    // ── Create email verification token ────────────────────────────────────
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS).toISOString();

    const { error: tokenError } = await db
      .from("email_verification_tokens")
      .insert({
        patient_id: patient.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      });

    if (tokenError) {
      console.error("[register] Failed to create verification token:", tokenError);
    }

    // ── Send verification email (non-fatal) ─────────────────────────────────
    try {
      await sendVerificationEmail(patient.email, patient.first_name, rawToken);
    } catch (emailError) {
      console.error("[register] Verification email send failed:", emailError);
      // Non-fatal — patient can request a resend from /verify-email
    }

    // ── Audit log ───────────────────────────────────────────────────────────
    await logAuditEvent(
      "patient",
      patient.id,
      "register",
      "patient",
      patient.id,
      getClientIp(req)
    );

    return NextResponse.json({ emailVerificationSent: true });
  } catch (err) {
    console.error("[register] Unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
