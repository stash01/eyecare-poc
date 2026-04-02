import { NextRequest, NextResponse } from "next/server";
import { validateProviderSession } from "@/lib/server/provider-session";
import { db } from "@/lib/server/db";
import { logAuditEvent } from "@/lib/server/audit";
import { deleteDailyRoom } from "@/lib/server/daily-co";

export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = ["completed", "no_show", "cancelled", "in_progress"] as const;
type AllowedStatus = typeof ALLOWED_STATUSES[number];

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

// PATCH /api/appointments/[id]/status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await validateProviderSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { status } = await req.json();
  if (!ALLOWED_STATUSES.includes(status as AllowedStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Verify appointment belongs to this provider
  const { data: existing } = await db
    .from("appointments")
    .select("id, status")
    .eq("id", params.id)
    .eq("provider_uuid", session.providerId)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  const { error } = await db
    .from("appointments")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }

  // Clean up Daily.co room if cancelled
  if (status === "cancelled") {
    await deleteDailyRoom(params.id);
  }

  await logAuditEvent(
    "provider",
    session.providerId,
    "update_appointment_status",
    "appointments",
    params.id,
    getClientIp(req)
  );

  return NextResponse.json({ ok: true });
}
