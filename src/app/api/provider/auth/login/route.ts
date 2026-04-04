import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/server/request";
import bcrypt from "bcryptjs";
import { db } from "@/lib/server/db";
import { createProviderSession, setProviderSessionCookie } from "@/lib/server/provider-session";
import { logAuditEvent } from "@/lib/server/audit";

export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

async function isRateLimited(ip: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - WINDOW_MS).toISOString();
  const { count } = await db
    .from("audit_log")
    .select("*", { count: "exact", head: true })
    .eq("action", "provider_login_failed")
    .eq("ip_address", ip)
    .gte("created_at", windowStart)
    .then((r) => ({ count: r.count ?? 0 }));
  return count >= MAX_ATTEMPTS;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    if (await isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many failed attempts. Please try again later." },
        { status: 429 }
      );
    }

    const { data: provider } = await db
      .from("providers")
      .select("id, email, name, credentials, password_hash, active")
      .eq("email", email.toLowerCase().trim())
      .single();

    // Always run bcrypt to prevent timing attacks
    const dummyHash = "$2a$12$dummy.hash.to.prevent.timing.attack.xxxxxxxxxxxxxxxxxx";
    const hash = provider?.password_hash ?? dummyHash;
    const valid = await bcrypt.compare(password, hash);

    if (!provider || !valid || !provider.active) {
      await logAuditEvent("provider", provider?.id ?? "unknown", "provider_login_failed", "providers", null, ip);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await createProviderSession(provider.id, ip);
    setProviderSessionCookie(token);

    await logAuditEvent("provider", provider.id, "provider_login", "providers", provider.id, ip);

    return NextResponse.json({
      provider: {
        id: provider.id,
        name: provider.name,
        credentials: provider.credentials,
        email: provider.email,
      },
    });
  } catch (err) {
    console.error("[provider/auth/login] Unexpected error:", err);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
