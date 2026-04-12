import { NextRequest, NextResponse } from "next/server"
import { validateProviderSession } from "@/lib/server/provider-session"
import { db } from "@/lib/server/db"

export const dynamic = "force-dynamic"

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await validateProviderSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: appt, error } = await db
    .from("appointments")
    .select(`
      id, scheduled_at, duration_minutes, status, video_room_url,
      patient_id,
      assessment_result_id
    `)
    .eq("id", params.id)
    .single()

  if (error || !appt) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
  }

  const { data: patient } = await db
    .from("patients")
    .select("first_name, last_name, email")
    .eq("id", appt.patient_id)
    .single()

  let assessment = null
  if (appt.assessment_result_id) {
    const { data: a } = await db
      .from("assessment_results")
      .select("severity, risk_tier, frequency_score, intensity_score, frequency_severity, intensity_severity, risk_factor_count, tried_treatments, raw_answers")
      .eq("id", appt.assessment_result_id)
      .single()

    if (a) {
      const raw = (a.raw_answers ?? {}) as Record<string, unknown>
      assessment = {
        severity: a.severity,
        riskTier: a.risk_tier ?? "low",
        frequencyScore: a.frequency_score ?? 0,
        intensityScore: a.intensity_score ?? 0,
        frequencySeverity: a.frequency_severity ?? "mild",
        intensitySeverity: a.intensity_severity ?? "mild",
        riskFactorCount: a.risk_factor_count ?? 0,
        priorTreatment: a.tried_treatments ?? false,
        ocularConditions: (raw.ocularConditions as string[]) ?? [],
        medicalConditions: (raw.medicalConditions as string[]) ?? [],
        pastFailedTreatments: (raw.pastFailedTreatments as string[]) ?? [],
        currentTreatments: (raw.currentTreatments as string[]) ?? [],
      }
    }
  }

  return NextResponse.json({
    appointment: {
      id: appt.id,
      scheduledAt: appt.scheduled_at,
      durationMinutes: appt.duration_minutes,
      status: appt.status,
      videoRoomUrl: appt.video_room_url,
      patient: patient
        ? { firstName: patient.first_name, lastName: patient.last_name, email: patient.email }
        : { firstName: "Unknown", lastName: "Patient", email: "" },
      assessment,
    },
  })
}
