import { NextResponse } from "next/server";
import { validateProviderSession } from "@/lib/server/provider-session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await validateProviderSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ provider: session });
}
