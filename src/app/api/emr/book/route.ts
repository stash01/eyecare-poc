import { NextRequest, NextResponse } from "next/server"
import { validateSession } from "@/lib/server/session"
import { db } from "@/lib/server/db"
import { logAuditEvent } from "@/lib/server/audit"
import { createAndAttachVideoRoom } from "@/lib/server/daily-co"
import { sendConfirmationForIds } from "@/lib/server/email"
import { getClientIp } from "@/lib/server/request"
import { emr, SlotTakenError } from "@/lib/server/emr"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const session = await validateSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: patient, error: patientErr } = await db
    .from("patients")
    .select("id, first_name, last_name, email, date_of_birth, health_card_number, emr_patient_id, subscription_status")
    .eq("id", session.patientId)
    .single()

  if (patientErr || !patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 })
  }

  if (patient.subscription_status !== "active") {
    return NextResponse.json({ error: "Active subscription required" }, { status: 403 })
  }

  let body: { providerId: string; startAt: string; durationMinutes?: number; assessmentResultId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { providerId, startAt, durationMinutes = 30, assessmentResultId } = body

  if (!providerId || !startAt) {
    return NextResponse.json({ error: "providerId and startAt are required" }, { status: 400 })
  }

  try {
    // 1. Ensure patient exists in EMR
    let emrPatientId = patient.emr_patient_id
    if (!emrPatientId) {
      emrPatientId = await emr.ensurePatient({
        firstName: patient.first_name,
        lastName: patient.last_name,
        email: patient.email,
        dateOfBirth: patient.date_of_birth,
        healthCardNumber: patient.health_card_number ?? undefined,
      })
      await db.from("patients").update({ emr_patient_id: emrPatientId }).eq("id", session.patientId)
    }

    // 2. Book appointment in EMR
    const { emrAppointmentId } = await emr.bookAppointment({ emrPatientId, providerId, startAt, durationMinutes })

    // 3. Insert appointment in Klara DB first (need UUID for Daily.co room name)
    const { data: appointment, error: insertErr } = await db
      .from("appointments")
      .insert({
        patient_id: session.patientId,
        assessment_result_id: assessmentResultId ?? null,
        scheduled_at: startAt,
        duration_minutes: durationMinutes,
        appointment_type: "new_patient",
        status: "scheduled",
        emr_appointment_id: emrAppointmentId,
        note_push_status: "pending",
      })
      .select("id")
      .single()

    if (insertErr || !appointment) {
      console.error("[emr/book] DB insert error:", insertErr)
      return NextResponse.json({ error: "Failed to save appointment" }, { status: 500 })
    }

    // 4. Create Daily.co video room (using Klara UUID as room name)
    const videoRoomUrl = await createAndAttachVideoRoom(appointment.id, startAt)

    await logAuditEvent("patient", session.patientId, "create_appointment", "appointments", appointment.id, getClientIp(req))

    // 5. Confirmation email (non-fatal)
    try {
      await sendConfirmationForIds({
        appointmentId: appointment.id,
        patientId: session.patientId,
        providerId,
        scheduledAt: startAt,
        durationMinutes,
        videoRoomUrl: videoRoomUrl ?? null,
      })
    } catch (emailErr) {
      console.error("[emr/book] Confirmation email failed:", emailErr)
    }

    // 6. Async note push — fire and forget
    if (assessmentResultId) {
      pushNoteAsync(appointment.id, assessmentResultId, emrPatientId, emrAppointmentId, startAt)
    }

    return NextResponse.json({ appointmentId: appointment.id }, { status: 201 })
  } catch (err) {
    if (err instanceof SlotTakenError) {
      return NextResponse.json({ error: "That time slot is no longer available. Please select another time." }, { status: 409 })
    }
    console.error("[emr/book] Unexpected error:", err)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

async function pushNoteAsync(
  appointmentId: string,
  assessmentResultId: string,
  emrPatientId: string,
  emrAppointmentId: string,
  scheduledAt: string
) {
  try {
    const { data: assessment } = await db
      .from("assessment_results")
      .select("severity, frequency_score, intensity_score, risk_tier, risk_factor_count, tried_treatments, raw_answers, frequency_severity, intensity_severity")
      .eq("id", assessmentResultId)
      .single()

    if (!assessment) return

    const date = scheduledAt.split("T")[0]
    const raw = (assessment.raw_answers ?? {}) as Record<string, unknown>
    const noteText = buildNoteText({
      frequencyScore: assessment.frequency_score ?? 0,
      intensityScore: assessment.intensity_score ?? 0,
      frequencySeverity: assessment.frequency_severity ?? "mild",
      intensitySeverity: assessment.intensity_severity ?? "mild",
      riskFactorCount: assessment.risk_factor_count ?? 0,
      riskTier: assessment.risk_tier ?? "low",
      severity: assessment.severity,
      priorTreatment: assessment.tried_treatments ?? false,
      medicalConditions: (raw.medicalConditions as string[]) ?? [],
      ocularConditions: (raw.ocularConditions as string[]) ?? [],
      pastFailedTreatments: (raw.pastFailedTreatments as string[]) ?? [],
      date,
    })

    const { emrNoteId } = await emr.pushNote({ emrPatientId, emrAppointmentId, noteText, date })
    await db.from("appointments").update({ emr_note_id: emrNoteId, note_push_status: "pushed" }).eq("id", appointmentId)
  } catch (err) {
    console.error("[emr/book] Note push failed, queuing for retry:", err)
    await db.from("emr_note_retry_queue").insert({
      appointment_id: appointmentId,
      assessment_result_id: assessmentResultId,
      attempts: 1,
      last_attempted_at: new Date().toISOString(),
      last_error: err instanceof Error ? err.message : String(err),
    })
    await db.from("appointments").update({ note_push_status: "failed" }).eq("id", appointmentId)
  }
}

function buildNoteText(params: {
  frequencyScore: number; intensityScore: number
  frequencySeverity: string; intensitySeverity: string
  riskFactorCount: number; riskTier: string
  severity: string; priorTreatment: boolean
  medicalConditions: string[]; ocularConditions: string[]
  pastFailedTreatments: string[]; date: string
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
