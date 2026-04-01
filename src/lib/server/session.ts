import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { db } from "./db";

const SESSION_COOKIE = "klaramd_session";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

export interface SessionPayload {
  patientId: string;
  email: string;
  firstName: string;
  lastName: string;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(
  payload: SessionPayload,
  ipAddress: string
): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  const { error } = await db.from("auth_sessions").insert({
    patient_id: payload.patientId,
    token_hash: tokenHash,
    expires_at: expiresAt,
    ip_address: ipAddress,
  });

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`);
  }

  return token;
}

export function setSessionCookie(token: string): void {
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_MS / 1000,
    path: "/",
  });
}

export function clearSessionCookie(): void {
  cookies().set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

export async function validateSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);

  const { data: session, error } = await db
    .from("auth_sessions")
    .select("patient_id, expires_at")
    .eq("token_hash", tokenHash)
    .single();

  if (error || !session) return null;
  if (new Date(session.expires_at) < new Date()) {
    // Expired — clean up
    await db.from("auth_sessions").delete().eq("token_hash", tokenHash);
    return null;
  }

  const { data: patient, error: patientError } = await db
    .from("patients")
    .select("id, email, first_name, last_name")
    .eq("id", session.patient_id)
    .single();

  if (patientError || !patient) return null;

  return {
    patientId: patient.id,
    email: patient.email,
    firstName: patient.first_name,
    lastName: patient.last_name,
  };
}

export async function deleteSession(): Promise<void> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return;
  const tokenHash = hashToken(token);
  await db.from("auth_sessions").delete().eq("token_hash", tokenHash);
}

export function getSessionToken(): string | undefined {
  return cookies().get(SESSION_COOKIE)?.value;
}
