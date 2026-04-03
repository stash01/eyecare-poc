import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/server/session";
import { db } from "@/lib/server/db";
import { logAuditEvent } from "@/lib/server/audit";
import { createDailyRoom } from "@/lib/server/daily-co";
import { sendAppointmentConfirmation } from "@/lib/server/email";

export const dynamic = "force-dynamic";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

// GET /api/appointments — list current patient's appointments with provider names
export async function GET() {
  const session = await validateSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: appointments, error } = await db
    .from("appointments")
    .select(
      "id, provider_uuid, scheduled_at, duration_minutes, appointment_type, status, video_room_url"
    )
    .eq("patient_id", session.patientId)
    .order("scheduled_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }

  // Enrich with provider names
  const providerIds = Array.from(
    new Set((appointments ?? []).map((a) => a.provider_uuid).filter(Boolean))
  );
  let providerMap: Record<string, { name: string; credentials: string; specialty: string }> = {};

  if (providerIds.length > 0) {
    const { data: providers } = await db
      .from("providers")
      .select("id, name, credentials, specialty")
      .in("id", providerIds);
    providerMap = Object.fromEntries((providers ?? []).map((p) => [p.id, p]));
  }

  const enriched = (appointments ?? []).map((apt) => ({
    id: apt.id,
    scheduledAt: apt.scheduled_at,
    durationMinutes: apt.duration_minutes,
    appointmentType: apt.appointment_type,
    status: apt.status,
    videoRoomUrl: apt.video_room_url,
    provider: providerMap[apt.provider_uuid] ?? null,
  }));

  return NextResponse.json({ appointments: enriched });
}

// POST /api/appointments — patient books an appointment
export async function POST(req: NextRequest) {
  const session = await validateSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { provider_id, scheduled_at, duration_minutes = 15, appointment_type = "new_patient" } = body;

    if (!provider_id || !scheduled_at) {
      return NextResponse.json({ error: "provider_id and scheduled_at are required" }, { status: 400 });
    }

    const { data: provider, error: providerError } = await db
      .from("providers")
      .select("id")
      .eq("id", provider_id)
      .eq("active", true)
      .single();

    if (providerError || !provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    const slotEnd = new Date(new Date(scheduled_at).getTime() + duration_minutes * 60_000).toISOString();
    const { data: conflict } = await db
      .from("appointments")
      .select("id")
      .eq("provider_uuid", provider_id)
      .gte("scheduled_at", scheduled_at)
      .lt("scheduled_at", slotEnd)
      .not("status", "eq", "cancelled")
      .limit(1);

    if (conflict && conflict.length > 0) {
      return NextResponse.json({ error: "That time slot is no longer available" }, { status: 409 });
    }

    const { data: appointment, error: insertError } = await db
      .from("appointments")
      .insert({
        patient_id: session.patientId,
        provider_uuid: provider_id,
        scheduled_at,
        duration_minutes,
        appointment_type,
        status: "scheduled",
        ohip_eligible: false,
        billing_status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !appointment) {
      console.error("[appointments] Insert error:", insertError);
      return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
    }

    // Create Daily.co video room (no-op if DAILY_API_KEY not set)
    let videoUrl: string | null = null;
    try {
      videoUrl = await createDailyRoom(appointment.id, scheduled_at);
      if (videoUrl) {
        await db
          .from("appointments")
          .update({ video_room_url: videoUrl })
          .eq("id", appointment.id);
      }
    } catch (videoErr) {
      console.error("[appointments] Daily.co room creation failed:", videoErr);
    }

    await logAuditEvent(
      "patient",
      session.patientId,
      "create_appointment",
      "appointments",
      appointment.id,
      getClientIp(req)
    );

    // Send confirmation emails (fire-and-forget — never block the booking response)
    try {
      const [{ data: patientRow }, { data: providerRow }] = await Promise.all([
        db.from("patients").select("email, first_name, last_name").eq("id", session.patientId).single(),
        db.from("providers").select("email, name, credentials").eq("id", provider_id).single(),
      ]);
      if (patientRow && providerRow) {
        await sendAppointmentConfirmation({
          appointmentId: appointment.id,
          scheduledAt: scheduled_at,
          durationMinutes: duration_minutes,
          videoRoomUrl: videoUrl,
          patient: { email: patientRow.email, firstName: patientRow.first_name, lastName: patientRow.last_name },
          provider: { email: providerRow.email, name: providerRow.name, credentials: providerRow.credentials ?? "" },
        });
      }
    } catch (emailErr) {
      console.error("[appointments] Confirmation email failed:", emailErr);
    }

    return NextResponse.json({ appointment: { id: appointment.id } }, { status: 201 });
  } catch (err) {
    console.error("[appointments] Unexpected error:", err);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
