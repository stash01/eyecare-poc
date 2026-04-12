import { NextRequest, NextResponse } from "next/server"
import { validateSession } from "@/lib/server/session"
import { emr } from "@/lib/server/emr"

export const dynamic = "force-dynamic"

// GET /api/emr/slots
// Without params: returns provider list
// With ?providerId=X&days=14: returns available slots
export async function GET(req: NextRequest) {
  const session = await validateSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const providerId = searchParams.get("providerId")
  const days = parseInt(searchParams.get("days") ?? "14", 10)

  if (!providerId) {
    const providers = await emr.getProviders()
    return NextResponse.json({ providers })
  }

  const slots = await emr.getSlots({ providerId, days })
  return NextResponse.json({ slots })
}
