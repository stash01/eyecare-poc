import { NextResponse } from "next/server";
import { validateSession } from "@/lib/server/session";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

// GET /api/appointments — list current patient's appointments
export async function GET() {
  const session = await validateSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: appointments, error } = await db
    .from("appointments")
    .select(
      "id, scheduled_at, duration_minutes, appointment_type, status, video_room_url"
    )
    .eq("patient_id", session.patientId)
    .order("scheduled_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }

  const enriched = (appointments ?? []).map((apt) => ({
    id: apt.id,
    scheduledAt: apt.scheduled_at,
    durationMinutes: apt.duration_minutes,
    appointmentType: apt.appointment_type,
    status: apt.status,
    videoRoomUrl: apt.video_room_url,
    provider: { name: "KlaraMD Provider" },
  }));

  return NextResponse.json({ appointments: enriched });
}

