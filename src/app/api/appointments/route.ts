import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/server/session";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";
import { logAuditEvent } from "@/lib/server/audit";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

// GET /api/appointments — list current patient's appointments
export async function GET() {
  const session = await validateSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: appointments, error } = await db
    .from("appointments")
    .select("id, provider_uuid, scheduled_at, duration_minutes, appointment_type, status, video_room_url")
    .eq("patient_id", session.patientId)
    .order("scheduled_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }

  return NextResponse.json({ appointments: appointments ?? [] });
}

// POST /api/appointments — book an appointment
export async function POST(req: NextRequest) {
  const session = await validateSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { provider_id, scheduled_at, duration_minutes = 30, appointment_type = "new_patient" } = body;

    if (!provider_id || !scheduled_at) {
      return NextResponse.json({ error: "provider_id and scheduled_at are required" }, { status: 400 });
    }

    // Verify provider exists and is active
    const { data: provider, error: providerError } = await db
      .from("providers")
      .select("id")
      .eq("id", provider_id)
      .eq("active", true)
      .single();

    if (providerError || !provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // Check the slot is still available (basic conflict check)
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

    await logAuditEvent(
      "patient",
      session.patientId,
      "create_appointment",
      "appointments",
      appointment.id,
      getClientIp(req)
    );

    return NextResponse.json({ appointment: { id: appointment.id } }, { status: 201 });
  } catch (err) {
    console.error("[appointments] Unexpected error:", err);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
