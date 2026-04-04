import { NextRequest, NextResponse } from "next/server";
import { validateProviderSession } from "@/lib/server/provider-session";
import { db } from "@/lib/server/db";
import { logAuditEvent } from "@/lib/server/audit";
import { createAndAttachVideoRoom } from "@/lib/server/daily-co";
import { sendConfirmationForIds } from "@/lib/server/email";
import { getClientIp } from "@/lib/server/request";

export const dynamic = "force-dynamic";

// POST /api/provider/appointments — provider confirms a time for a pending consultation request
export async function POST(req: NextRequest) {
  const session = await validateProviderSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { consultation_request_id, provider_id, scheduled_at, duration_minutes = 15 } = body;

    if (!consultation_request_id || !provider_id || !scheduled_at) {
      return NextResponse.json(
        { error: "consultation_request_id, provider_id, and scheduled_at are required" },
        { status: 400 }
      );
    }

    const { data: request, error: requestError } = await db
      .from("consultation_requests")
      .select("id, patient_id, status")
      .eq("id", consultation_request_id)
      .single();

    if (requestError || !request) {
      return NextResponse.json({ error: "Consultation request not found" }, { status: 404 });
    }
    if (request.status !== "pending") {
      return NextResponse.json({ error: "Request is no longer pending" }, { status: 409 });
    }

    const { data: windows } = await db
      .from("patient_availability")
      .select("available_from, available_until")
      .eq("consultation_request_id", consultation_request_id);

    const slotStart = new Date(scheduled_at);
    const slotEnd = new Date(slotStart.getTime() + duration_minutes * 60_000);

    const withinWindow = (windows ?? []).some((w) => {
      const wFrom = new Date(w.available_from);
      const wUntil = new Date(w.available_until);
      return slotStart >= wFrom && slotEnd <= wUntil;
    });

    if (!withinWindow) {
      return NextResponse.json(
        { error: "Chosen time is outside the patient's availability windows" },
        { status: 422 }
      );
    }

    // Conflict check — prevent double-booking the provider
    const { data: conflict } = await db
      .from("appointments")
      .select("id")
      .eq("provider_uuid", provider_id)
      .gte("scheduled_at", scheduled_at)
      .lt("scheduled_at", slotEnd.toISOString())
      .not("status", "eq", "cancelled")
      .limit(1);

    if (conflict && conflict.length > 0) {
      return NextResponse.json({ error: "That time slot is no longer available" }, { status: 409 });
    }

    const { data: appointment, error: apptError } = await db
      .from("appointments")
      .insert({
        patient_id: request.patient_id,
        provider_uuid: provider_id,
        consultation_request_id,
        scheduled_at,
        duration_minutes,
        appointment_type: "new_patient",
        status: "scheduled",
        ohip_eligible: false,
        billing_status: "pending",
      })
      .select("id")
      .single();

    if (apptError || !appointment) {
      console.error("[provider/appointments] Insert error:", apptError);
      return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
    }

    await db
      .from("consultation_requests")
      .update({ status: "scheduled", updated_at: new Date().toISOString() })
      .eq("id", consultation_request_id);

    const videoUrl = await createAndAttachVideoRoom(appointment.id, scheduled_at);

    await logAuditEvent(
      "provider",
      session.providerId,
      "book_appointment",
      "appointments",
      appointment.id,
      getClientIp(req)
    );

    try {
      await sendConfirmationForIds({
        appointmentId: appointment.id,
        patientId: request.patient_id,
        providerId: provider_id,
        scheduledAt: scheduled_at,
        durationMinutes: duration_minutes,
        videoRoomUrl: videoUrl,
      });
    } catch (emailErr) {
      console.error("[provider/appointments] Confirmation email failed:", emailErr);
    }

    return NextResponse.json({ appointment: { id: appointment.id } }, { status: 201 });
  } catch (err) {
    console.error("[provider/appointments] Unexpected error:", err);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
