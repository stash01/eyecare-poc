import { NextRequest, NextResponse } from "next/server";
import { validateProviderSession } from "@/lib/server/provider-session";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

// GET /api/provider/schedule
// Returns the authenticated provider's appointments for today + next 7 days
export async function GET(req: NextRequest) {
  void req;
  const session = await validateProviderSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowEnd = new Date(now);
  windowEnd.setDate(windowEnd.getDate() + 7);

  const { data: appointments, error } = await db
    .from("appointments")
    .select(
      "id, scheduled_at, duration_minutes, appointment_type, status, ohip_eligible, billing_status, video_room_url, patient_id"
    )
    .eq("provider_uuid", session.providerId)
    .gte("scheduled_at", now.toISOString())
    .lte("scheduled_at", windowEnd.toISOString())
    .not("status", "eq", "cancelled")
    .order("scheduled_at", { ascending: true });

  if (error) {
    console.error("[provider/schedule] DB error:", error);
    return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 500 });
  }

  // Enrich with patient names
  const patientIds = Array.from(new Set((appointments ?? []).map((a) => a.patient_id).filter(Boolean)));
  let patientMap: Record<string, { first_name: string; last_name: string; email: string }> = {};

  if (patientIds.length > 0) {
    const { data: patients } = await db
      .from("patients")
      .select("id, first_name, last_name, email")
      .in("id", patientIds);

    patientMap = Object.fromEntries((patients ?? []).map((p) => [p.id, p]));
  }

  const enriched = (appointments ?? []).map((apt) => ({
    id: apt.id,
    scheduledAt: apt.scheduled_at,
    durationMinutes: apt.duration_minutes,
    appointmentType: apt.appointment_type,
    status: apt.status,
    ohipEligible: apt.ohip_eligible,
    billingStatus: apt.billing_status,
    videoRoomUrl: apt.video_room_url,
    patient: patientMap[apt.patient_id] ?? null,
  }));

  return NextResponse.json({ appointments: enriched });
}
