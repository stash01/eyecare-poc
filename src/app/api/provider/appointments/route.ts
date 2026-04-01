import { NextRequest, NextResponse } from "next/server";
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

// POST /api/provider/appointments — provider books a specific time for a pending request
// NOTE: Provider auth not yet implemented — protected by network/deployment config in POC.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      consultation_request_id,
      provider_id,
      scheduled_at,
      duration_minutes = 30,
    } = body;

    if (!consultation_request_id || !provider_id || !scheduled_at) {
      return NextResponse.json(
        { error: "consultation_request_id, provider_id, and scheduled_at are required" },
        { status: 400 }
      );
    }

    // Verify the request exists and is still pending
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

    // Verify the chosen time falls within at least one of the patient's availability windows
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

    // Create the appointment
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

    // Mark the consultation request as scheduled
    await db
      .from("consultation_requests")
      .update({ status: "scheduled", updated_at: new Date().toISOString() })
      .eq("id", consultation_request_id);

    await logAuditEvent(
      "provider",
      provider_id,
      "book_appointment",
      "appointments",
      appointment.id,
      getClientIp(req)
    );

    return NextResponse.json({ appointment: { id: appointment.id } }, { status: 201 });
  } catch (err) {
    console.error("[provider/appointments] Unexpected error:", err);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
