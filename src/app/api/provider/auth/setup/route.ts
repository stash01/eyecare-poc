/**
 * One-time provider password setup endpoint.
 * Use this to set initial passwords after running migration 006.
 * REMOVE OR DISABLE this route after initial setup.
 *
 * POST /api/provider/auth/setup
 * Body: { cpso: "12345", password: "your-password" }
 */
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Disable in production unless explicitly enabled
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_PROVIDER_SETUP) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  try {
    const { cpso, password } = await req.json();
    if (!cpso || !password || password.length < 8) {
      return NextResponse.json({ error: "cpso and password (min 8 chars) required" }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 12);

    const { data, error } = await db
      .from("providers")
      .update({ password_hash: hash })
      .eq("cpso_number", cpso)
      .select("id, name, email")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, name: data.name, email: data.email });
  } catch (err) {
    console.error("[provider/auth/setup]", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
