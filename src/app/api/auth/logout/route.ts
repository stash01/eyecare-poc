import { NextResponse } from "next/server";
import { deleteSession, clearSessionCookie } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await deleteSession();
    clearSessionCookie();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[logout] Error:", err);
    // Clear cookie regardless of DB error
    clearSessionCookie();
    return NextResponse.json({ ok: true });
  }
}
