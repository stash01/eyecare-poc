import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

// GET /api/providers — list active providers (public, no auth required)
export async function GET() {
  const { data: providers, error } = await db
    .from("providers")
    .select("id, name, credentials, specialty, subspecialty, expertise, cpso_number")
    .eq("active", true)
    .order("name");

  if (error) {
    return NextResponse.json({ error: "Failed to fetch providers" }, { status: 500 });
  }

  return NextResponse.json({ providers: providers ?? [] });
}
