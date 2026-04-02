import { NextResponse } from "next/server";
import { deleteProviderSession, clearProviderSessionCookie } from "@/lib/server/provider-session";

export const dynamic = "force-dynamic";

export async function POST() {
  await deleteProviderSession();
  clearProviderSessionCookie();
  return NextResponse.json({ ok: true });
}
