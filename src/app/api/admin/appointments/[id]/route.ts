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

// PATCH /api/admin/appointments/[id] — update any fields of an appointment
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await validateSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { scheduled_at, provider_id, duration_minutes, appointment_type, status } = body;

  // Fetch existing appointment to detect what changed
  const { data: existing, error: fetchError } = await db
    .from("appointments")
    .select("patient_id, provider_uuid, scheduled_at, duration_minutes, video_room_url")
    .eq("id", params.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  // Validate provider if being changed
  if (provider_id && provider_id !== existing.provider_uuid) {
    const { data: provider } = await db
      .from("providers")
      .select("id")
      .eq("id", provider_id)
      .eq("active", true)
      .single();
    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (scheduled_at !== undefined) updates.scheduled_at = scheduled_at;
  if (provider_id !== undefined) updates.provider_uuid = provider_id;
  if (duration_minutes !== undefined) updates.duration_minutes = duration_minutes;
  if (appointment_type !== undefined) updates.appointment_type = appointment_type;
  if (status !== undefined) updates.status = status;

  const { error: updateError } = await db
    .from("appointments")
    .update(updates)
    .eq("id", params.id);

  if (updateError) {
    console.error("[admin/appointments/patch] Update error:", updateError);
    return NextResponse.json({ error: "Failed to update appointment" }, { status: 500 });
  }

  await logAuditEvent(
    "patient",
    session.patientId,
    "admin_edit_appointment",
    "appointments",
    params.id,
    getClientIp(req),
    updates
  );

  // Send update email if date/time or provider changed
  const timeChanged = scheduled_at && scheduled_at !== existing.scheduled_at;
  const providerChanged = provider_id && provider_id !== existing.provider_uuid;

  if (timeChanged || providerChanged) {
    try {
      const effectiveProviderId = provider_id ?? existing.provider_uuid;
      const effectiveScheduledAt = scheduled_at ?? existing.scheduled_at;
      const effectiveDuration = duration_minutes ?? existing.duration_minutes;

      const [{ data: patientRow }, { data: providerRow }] = await Promise.all([
        db.from("patients").select("email, first_name, last_name").eq("id", existing.patient_id).single(),
        db.from("providers").select("email, name, credentials").eq("id", effectiveProviderId).single(),
      ]);

      if (patientRow && providerRow) {
        await sendAppointmentConfirmation({
          appointmentId: params.id,
          scheduledAt: effectiveScheduledAt,
          durationMinutes: effectiveDuration,
          videoRoomUrl: existing.video_room_url ?? null,
          patient: { email: patientRow.email, firstName: patientRow.first_name, lastName: patientRow.last_name },
          provider: { email: providerRow.email ?? "", name: providerRow.name, credentials: providerRow.credentials ?? "" },
          isUpdate: true,
        });
      }
    } catch (emailErr) {
      console.error("[admin/appointments/patch] Update email failed:", emailErr);
    }
  }

  return NextResponse.json({ ok: true });
}
