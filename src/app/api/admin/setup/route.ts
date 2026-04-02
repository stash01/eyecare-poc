/**
 * One-time admin password setup endpoint.
 * Use this after running migration 007 to set the admin account password.
 * Disabled in production unless ALLOW_ADMIN_SETUP=true.
 *
 * POST /api/admin/setup
 * Body: { "password": "your-password" }
 */
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_ADMIN_SETUP) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  try {
    const { password } = await req.json();
    if (!password || password.length < 8) {
      return NextResponse.json({ error: "password (min 8 chars) required" }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 12);

    const { data, error } = await db
      .from("patients")
      .update({ password_hash: hash, email_verified: true })
      .eq("email", "admin@klaramd.com")
      .eq("is_admin", true)
      .select("id, email, first_name")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Admin account not found — run migration 007 first" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, email: data.email, name: data.first_name });
  } catch (err) {
    console.error("[admin/setup]", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
