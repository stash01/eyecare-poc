import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/server/session";
import { db } from "@/lib/server/db";
import { createDailyRoom } from "@/lib/server/daily-co";
import { logAuditEvent } from "@/lib/server/audit";

export const dynamic = "force-dynamic";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

// POST /api/admin/appointments — admin books a pending request and assigns to any provider
export async function POST(req: NextRequest) {
  const session = await validateSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { consultation_request_id, provider_id, scheduled_at, duration_minutes = 30 } = body;

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

    // Verify provider exists and is active
    const { data: provider } = await db
      .from("providers")
      .select("id")
      .eq("id", provider_id)
      .eq("active", true)
      .single();

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
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
      console.error("[admin/appointments] Insert error:", apptError);
      return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
    }

    await db
      .from("consultation_requests")
      .update({ status: "scheduled", updated_at: new Date().toISOString() })
      .eq("id", consultation_request_id);

    // Create Daily.co room
    try {
      const videoUrl = await createDailyRoom(appointment.id, scheduled_at);
      if (videoUrl) {
        await db.from("appointments").update({ video_room_url: videoUrl }).eq("id", appointment.id);
      }
    } catch (videoErr) {
      console.error("[admin/appointments] Daily.co error:", videoErr);
    }

    await logAuditEvent(
      "patient",
      session.patientId,
      "admin_book_appointment",
      "appointments",
      appointment.id,
      getClientIp(req)
    );

    return NextResponse.json({ appointment: { id: appointment.id } }, { status: 201 });
  } catch (err) {
    console.error("[admin/appointments] Unexpected error:", err);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
