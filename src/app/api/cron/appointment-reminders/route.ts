import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { sendAppointmentReminder } from "@/lib/server/email";

export const dynamic = "force-dynamic";

// GET /api/cron/appointment-reminders
// Called by Vercel Cron every 5 minutes.
// Sends reminder emails for appointments starting in 55–65 minutes that haven't been reminded yet.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() + 55 * 60_000).toISOString();
  const windowEnd = new Date(now.getTime() + 65 * 60_000).toISOString();

  const { data: appointments, error } = await db
    .from("appointments")
    .select("id, patient_id, provider_uuid, scheduled_at, duration_minutes, video_room_url")
    .gte("scheduled_at", windowStart)
    .lte("scheduled_at", windowEnd)
    .is("reminder_sent_at", null)
    .eq("status", "scheduled");

  if (error) {
    console.error("[cron/reminders] Failed to fetch appointments:", error);
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }

  if (!appointments || appointments.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const patientIds = Array.from(new Set(appointments.map((a) => a.patient_id)));
  const providerIds = Array.from(new Set(appointments.map((a) => a.provider_uuid)));

  const [{ data: patients }, { data: providers }] = await Promise.all([
    db.from("patients").select("id, email, first_name").in("id", patientIds),
    db.from("providers").select("id, email, name").in("id", providerIds),
  ]);

  const patientMap = Object.fromEntries((patients ?? []).map((p) => [p.id, p]));
  const providerMap = Object.fromEntries((providers ?? []).map((p) => [p.id, p]));

  let sent = 0;
  for (const appt of appointments) {
    const patient = patientMap[appt.patient_id];
    const provider = providerMap[appt.provider_uuid];

    if (!patient || !provider || !provider.email) {
      console.warn(`[cron/reminders] Missing patient or provider for appointment ${appt.id}`);
      continue;
    }

    try {
      await sendAppointmentReminder({
        appointmentId: appt.id,
        scheduledAt: appt.scheduled_at,
        durationMinutes: appt.duration_minutes,
        videoRoomUrl: appt.video_room_url ?? null,
        patient: { email: patient.email, firstName: patient.first_name },
        provider: { email: provider.email, name: provider.name },
      });

      await db
        .from("appointments")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", appt.id);

      sent++;
    } catch (err) {
      console.error(`[cron/reminders] Failed to send reminder for appointment ${appt.id}:`, err);
    }
  }

  return NextResponse.json({ sent });
}
