import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/server/session";
import { validateProviderSession } from "@/lib/server/provider-session";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

// GET /api/appointments/[id] — fetch a single appointment (patient or provider session)
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Accept either session type
  const patientSession = await validateSession();
  const providerSession = patientSession ? null : await validateProviderSession();

  if (!patientSession && !providerSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: appointment, error } = await db
    .from("appointments")
    .select("id, patient_id, provider_uuid, scheduled_at, duration_minutes, appointment_type, status, video_room_url")
    .eq("id", params.id)
    .single();

  if (error || !appointment) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  // Enforce ownership
  if (patientSession && appointment.patient_id !== patientSession.patientId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (providerSession && appointment.provider_uuid !== providerSession.providerId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Enrich with provider info for the disclosure modal
  const { data: provider } = await db
    .from("providers")
    .select("id, name, credentials, specialty, cpso_number, location, phone")
    .eq("id", appointment.provider_uuid)
    .single();

  return NextResponse.json({
    appointment: {
      id: appointment.id,
      scheduledAt: appointment.scheduled_at,
      durationMinutes: appointment.duration_minutes,
      appointmentType: appointment.appointment_type,
      status: appointment.status,
      videoRoomUrl: appointment.video_room_url,
      provider: provider ?? null,
    },
  });
}
