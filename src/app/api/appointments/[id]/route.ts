import { NextRequest, NextResponse } from "next/server"
import { validateSession } from "@/lib/server/session"
import { db } from "@/lib/server/db"

export const dynamic = "force-dynamic"

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await validateSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: appointment, error } = await db
    .from("appointments")
    .select("id, scheduled_at, duration_minutes, appointment_type, status, video_room_url, emr_appointment_id, note_push_status")
    .eq("id", params.id)
    .eq("patient_id", session.patientId)
    .single()

  if (error || !appointment) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
  }

  return NextResponse.json({
    appointment: {
      id: appointment.id,
      scheduledAt: appointment.scheduled_at,
      durationMinutes: appointment.duration_minutes,
      appointmentType: appointment.appointment_type,
      status: appointment.status,
      videoRoomUrl: appointment.video_room_url,
      emrAppointmentId: appointment.emr_appointment_id,
      notePushStatus: appointment.note_push_status,
      provider: { name: "KlaraMD Provider" },
    },
  })
}
