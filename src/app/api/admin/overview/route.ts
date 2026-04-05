import { NextResponse } from "next/server";
import { validateSession } from "@/lib/server/session";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

// GET /api/admin/overview — all patients, assessments, and appointments (admin only)
export async function GET() {
  const session = await validateSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [
    { data: patients },
    { data: assessments },
    { data: appointments },
    { data: providers },
  ] = await Promise.all([
    db
      .from("patients")
      .select("id, first_name, last_name, email, created_at")
      .eq("is_admin", false)
      .order("created_at", { ascending: false }),
    db
      .from("assessment_results")
      .select("id, patient_id, severity, frequency_score, intensity_score, risk_tier, created_at")
      .order("created_at", { ascending: false }),
    db
      .from("appointments")
      .select("id, patient_id, provider_uuid, scheduled_at, duration_minutes, appointment_type, status, video_room_url")
      .order("scheduled_at", { ascending: false })
      .limit(200),
    db
      .from("providers")
      .select("id, name, credentials, specialty, email, active")
      .order("name", { ascending: true }),
  ]);

  const patientMap = Object.fromEntries(
    (patients ?? []).map((p) => [p.id, `${p.first_name} ${p.last_name}`])
  );
  const providerMap = Object.fromEntries(
    (providers ?? []).map((p) => [p.id, p.name])
  );

  // Count assessments per patient + latest severity
  const assessmentsByPatient: Record<string, { count: number; latestSeverity: string }> = {};
  for (const a of assessments ?? []) {
    if (!assessmentsByPatient[a.patient_id]) {
      assessmentsByPatient[a.patient_id] = { count: 0, latestSeverity: a.severity ?? "" };
    }
    assessmentsByPatient[a.patient_id].count++;
  }

  return NextResponse.json({
    patients: (patients ?? []).map((p) => ({
      id: p.id,
      firstName: p.first_name,
      lastName: p.last_name,
      email: p.email,
      createdAt: p.created_at,
      assessmentCount: assessmentsByPatient[p.id]?.count ?? 0,
      latestSeverity: assessmentsByPatient[p.id]?.latestSeverity ?? null,
    })),
    assessments: (assessments ?? []).map((a) => ({
      id: a.id,
      patientId: a.patient_id,
      patientName: patientMap[a.patient_id] ?? "Unknown",
      severity: a.severity,
      frequencyScore: a.frequency_score,
      intensityScore: a.intensity_score,
      riskTier: a.risk_tier,
      createdAt: a.created_at,
    })),
    appointments: (appointments ?? []).map((a) => ({
      id: a.id,
      patientId: a.patient_id,
      providerId: a.provider_uuid,
      patientName: patientMap[a.patient_id] ?? "Unknown",
      providerName: providerMap[a.provider_uuid] ?? "Unknown",
      scheduledAt: a.scheduled_at,
      durationMinutes: a.duration_minutes,
      appointmentType: a.appointment_type,
      status: a.status,
      videoRoomUrl: a.video_room_url,
    })),
    providers: (providers ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      credentials: p.credentials,
      specialty: p.specialty,
      email: p.email,
      active: p.active,
    })),
  });
}
