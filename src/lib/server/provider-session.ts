import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { db } from "./db";

export const PROVIDER_SESSION_COOKIE = "klaramd_provider_session";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

export interface ProviderSessionPayload {
  providerId: string;
  email: string;
  name: string;
  credentials: string;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createProviderSession(
  providerId: string,
  ipAddress: string
): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  const { error } = await db.from("provider_sessions").insert({
    provider_id: providerId,
    token_hash: tokenHash,
    expires_at: expiresAt,
    ip_address: ipAddress,
  });

  if (error) {
    throw new Error(`Failed to create provider session: ${error.message}`);
  }

  return token;
}

export function setProviderSessionCookie(token: string): void {
  cookies().set(PROVIDER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_MS / 1000,
    path: "/",
  });
}

export function clearProviderSessionCookie(): void {
  cookies().set(PROVIDER_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

export async function validateProviderSession(): Promise<ProviderSessionPayload | null> {
  const token = cookies().get(PROVIDER_SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);

  const { data: session, error } = await db
    .from("provider_sessions")
    .select("provider_id, expires_at")
    .eq("token_hash", tokenHash)
    .single();

  if (error || !session) return null;

  if (new Date(session.expires_at) < new Date()) {
    await db.from("provider_sessions").delete().eq("token_hash", tokenHash);
    return null;
  }

  const { data: provider, error: providerError } = await db
    .from("providers")
    .select("id, email, name, credentials")
    .eq("id", session.provider_id)
    .single();

  if (providerError || !provider) return null;

  return {
    providerId: provider.id,
    email: provider.email,
    name: provider.name,
    credentials: provider.credentials,
  };
}

export async function deleteProviderSession(): Promise<void> {
  const token = cookies().get(PROVIDER_SESSION_COOKIE)?.value;
  if (!token) return;
  const tokenHash = hashToken(token);
  await db.from("provider_sessions").delete().eq("token_hash", tokenHash);
}
