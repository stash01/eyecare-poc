import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/server/session";
import { db } from "@/lib/server/db";
import { logAuditEvent } from "@/lib/server/audit";
import { sendAppointmentConfirmation } from "@/lib/server/email";

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
    .select("id, name, email, credentials")
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

  // Send update emails to patient and new provider
  try {
    const { data: appt } = await db
      .from("appointments")
      .select("patient_id, scheduled_at, duration_minutes, video_room_url")
      .eq("id", params.id)
      .single();

    if (appt) {
      const { data: patientRow } = await db
        .from("patients")
        .select("email, first_name, last_name")
        .eq("id", appt.patient_id)
        .single();

      if (patientRow) {
        await sendAppointmentConfirmation({
          appointmentId: params.id,
          scheduledAt: appt.scheduled_at,
          durationMinutes: appt.duration_minutes,
          videoRoomUrl: appt.video_room_url ?? null,
          patient: { email: patientRow.email, firstName: patientRow.first_name, lastName: patientRow.last_name },
          provider: { email: provider.email ?? "", name: provider.name, credentials: provider.credentials ?? "" },
          isUpdate: true,
        });
      }
    }
  } catch (emailErr) {
    console.error("[admin/appointments/provider] Update email failed:", emailErr);
  }

  return NextResponse.json({ ok: true, providerName: provider.name });
}
