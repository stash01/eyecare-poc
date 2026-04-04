import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/server/session";
import { db } from "@/lib/server/db";
import { logAuditEvent } from "@/lib/server/audit";
import { sendConfirmationForIds } from "@/lib/server/email";
import { getClientIp } from "@/lib/server/request";

export const dynamic = "force-dynamic";

// PATCH /api/admin/appointments/[id]/provider — reassign appointment to a different provider
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await validateSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { provider_id } = await req.json();
    if (!provider_id) {
      return NextResponse.json({ error: "provider_id is required" }, { status: 400 });
    }

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
      "system",
      session.patientId,
      "admin_reassign_appointment",
      "appointments",
      params.id,
      getClientIp(req),
      { new_provider_id: provider_id, new_provider_name: provider.name }
    );

    try {
      const { data: appt } = await db
        .from("appointments")
        .select("patient_id, scheduled_at, duration_minutes, video_room_url")
        .eq("id", params.id)
        .single();

      if (appt) {
        await sendConfirmationForIds({
          appointmentId: params.id,
          patientId: appt.patient_id,
          providerId: provider_id,
          scheduledAt: appt.scheduled_at,
          durationMinutes: appt.duration_minutes,
          videoRoomUrl: appt.video_room_url ?? null,
          isUpdate: true,
        });
      }
    } catch (emailErr) {
      console.error("[admin/appointments/provider] Update email failed:", emailErr);
    }

    return NextResponse.json({ ok: true, providerName: provider.name });
  } catch (err) {
    console.error("[admin/appointments/provider] Unexpected error:", err);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
