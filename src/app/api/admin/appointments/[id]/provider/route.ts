import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/server/session";
import { db } from "@/lib/server/db";
import { logAuditEvent } from "@/lib/server/audit";

export const dynamic = "force-dynamic";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

// PATCH /api/admin/appointments/[id]/provider — reassign appointment to a different provider
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await validateSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { provider_id } = await req.json();
  if (!provider_id) {
    return NextResponse.json({ error: "provider_id is required" }, { status: 400 });
  }

  // Verify provider exists and is active
  const { data: provider } = await db
    .from("providers")
    .select("id, name")
    .eq("id", provider_id)
    .eq("active", true)
    .single();

  if (!provider) {
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }

  const { error } = await db
    .from("appointments")
    .update({ provider_uuid: provider_id, updated_at: new Date().toISOString() })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: "Failed to reassign appointment" }, { status: 500 });
  }

  await logAuditEvent(
    "patient",
    session.patientId,
    "admin_reassign_appointment",
    "appointments",
    params.id,
    getClientIp(req),
    { new_provider_id: provider_id, new_provider_name: provider.name }
  );

  return NextResponse.json({ ok: true, providerName: provider.name });
}
