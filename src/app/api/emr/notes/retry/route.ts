import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { emr } from "@/lib/server/emr"

export const dynamic = "force-dynamic"

const MAX_ATTEMPTS = 5

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: queue, error } = await db
    .from("emr_note_retry_queue")
    .select("id, appointment_id, assessment_result_id, attempts")
    .lt("attempts", MAX_ATTEMPTS)
    .order("created_at", { ascending: true })
    .limit(20)

  if (error) {
    console.error("[cron/note-retry] Failed to fetch queue:", error)
    return NextResponse.json({ error: "Failed to fetch queue" }, { status: 500 })
  }

  if (!queue || queue.length === 0) {
    return NextResponse.json({ processed: 0 })
  }

  let succeeded = 0, failed = 0, exhausted = 0

  for (const item of queue) {
    try {
      const { data: appt } = await db.from("appointments").select("emr_appointment_id, patient_id").eq("id", item.appointment_id).single()
      if (!appt?.emr_appointment_id) { await db.from("emr_note_retry_queue").delete().eq("id", item.id); continue }

      const { data: patient } = await db.from("patients").select("emr_patient_id").eq("id", appt.patient_id).single()
      if (!patient?.emr_patient_id) { failed++; continue }

      const { data: assessment } = await db
        .from("assessment_results")
        .select("severity, frequency_score, intensity_score, risk_tier, risk_factor_count, tried_treatments, raw_answers, frequency_severity, intensity_severity, created_at")
        .eq("id", item.assessment_result_id)
        .single()

      if (!assessment) { await db.from("emr_note_retry_queue").delete().eq("id", item.id); continue }

      const date = assessment.created_at.split("T")[0]
      const raw = (assessment.raw_answers ?? {}) as Record<string, unknown>
      const noteText = buildNoteText({
        frequencyScore: assessment.frequency_score ?? 0, intensityScore: assessment.intensity_score ?? 0,
        frequencySeverity: assessment.frequency_severity ?? "mild", intensitySeverity: assessment.intensity_severity ?? "mild",
        riskFactorCount: assessment.risk_factor_count ?? 0, riskTier: assessment.risk_tier ?? "low",
        severity: assessment.severity, priorTreatment: assessment.tried_treatments ?? false,
        medicalConditions: (raw.medicalConditions as string[]) ?? [], ocularConditions: (raw.ocularConditions as string[]) ?? [],
        pastFailedTreatments: (raw.pastFailedTreatments as string[]) ?? [], date,
      })

      const { emrNoteId } = await emr.pushNote({ emrPatientId: patient.emr_patient_id, emrAppointmentId: appt.emr_appointment_id, noteText, date })
      await db.from("appointments").update({ emr_note_id: emrNoteId, note_push_status: "pushed" }).eq("id", item.appointment_id)
      await db.from("emr_note_retry_queue").delete().eq("id", item.id)
      succeeded++
    } catch (err) {
      const newAttempts = item.attempts + 1
      if (newAttempts >= MAX_ATTEMPTS) {
        await db.from("appointments").update({ note_push_status: "failed" }).eq("id", item.appointment_id)
        await db.from("emr_note_retry_queue").delete().eq("id", item.id)
        exhausted++
      } else {
        await db.from("emr_note_retry_queue").update({ attempts: newAttempts, last_attempted_at: new Date().toISOString(), last_error: err instanceof Error ? err.message : String(err) }).eq("id", item.id)
        failed++
      }
    }
  }

  return NextResponse.json({ processed: queue.length, succeeded, failed, exhausted })
}

function buildNoteText(params: {
  frequencyScore: number; intensityScore: number; frequencySeverity: string; intensitySeverity: string
  riskFactorCount: number; riskTier: string; severity: string; priorTreatment: boolean
  medicalConditions: string[]; ocularConditions: string[]; pastFailedTreatments: string[]; date: string
}): string {
  const riskConditions = [...params.medicalConditions, ...params.ocularConditions].filter(c => c !== "none")
  return [
    `KlaraMD Dry Eye Assessment`, `Date: ${params.date}`, ``,
    `Scores`,
    `  Frequency Score:  ${params.frequencyScore} / 24  (${params.frequencySeverity})`,
    `  Intensity Score:  ${params.intensityScore} / 60  (${params.intensitySeverity})`,
    `  Final Severity:   ${params.severity.toUpperCase()}`, ``,
    `Risk Profile`,
    `  Risk Factor Count: ${params.riskFactorCount}`,
    `  Risk Tier:         ${params.riskTier.toUpperCase()}`,
    `  Prior Treatment:   ${params.priorTreatment ? "Yes" : "No"}`, ``,
    `Relevant History`,
    riskConditions.length > 0 ? riskConditions.map(c => `  - ${c}`).join("\n") : `  None identified`, ``,
    `Past Failed Treatments`,
    params.pastFailedTreatments.length > 0 ? params.pastFailedTreatments.map(t => `  - ${t}`).join("\n") : `  None`, ``,
    `─────────────────────────────────────────────────`,
    `Generated by KlaraMD clinical decision support.`,
    `To be reviewed and confirmed by treating ophthalmologist.`,
  ].join("\n")
}
