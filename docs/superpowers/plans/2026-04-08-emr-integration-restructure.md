# KlaraMD EMR Integration & Restructure — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace native Supabase scheduling with an EMR adapter pattern, restructure routes under `/patient/*` and `/provider/*`, and enforce subscription gating so assessment is free but results/booking require an active subscription.

**Architecture:** Big-bang rewrite — build all new code first, then delete dead code last. Each task is independently committable. No strangler pattern needed (POC — downtime acceptable). The EMR adapter ships as a mock; swapping to a real EMR is a one-line change.

**Tech Stack:** Next.js 14 App Router, Supabase (service role, Canada Central), Stripe, Daily.co, Resend, Tailwind, TypeScript.

---

## File Map

### New files
| File | Purpose |
|---|---|
| `migrations/011_emr_integration.sql` | Drop dead tables, add EMR columns, create retry queue |
| `src/lib/server/emr.ts` | EMR adapter interface + MockEmrAdapter |
| `src/app/api/emr/slots/route.ts` | GET providers + available slots from EMR |
| `src/app/api/emr/book/route.ts` | POST full booking orchestration |
| `src/app/api/emr/notes/retry/route.ts` | POST cron — retry failed note pushes |
| `src/app/patient/layout.tsx` | Auth guard layout for all /patient/* routes |
| `src/app/patient/assessment/page.tsx` | Moved from /assessment, redirect updated |
| `src/app/patient/results/page.tsx` | Merged /assessment-results + /recommendations, soft gate |
| `src/app/patient/booking/page.tsx` | Rebuilt booking UI using EMR adapter |
| `src/app/patient/dashboard/page.tsx` | Moved from /dashboard, updated for new schema |
| `src/app/patient/shop/page.tsx` | Moved from /shop |
| `src/app/patient/shop/[productId]/page.tsx` | Moved from /shop/[productId] |
| `src/app/patient/shop/cart/page.tsx` | Moved from /shop/cart |
| `src/app/patient/shop/checkout/page.tsx` | Moved from /shop/checkout |
| `src/app/patient/shop/order-confirmation/page.tsx` | Moved from /shop/order-confirmation |
| `src/app/provider/dashboard/page.tsx` | Rebuilt — read-only today's appointments |
| `src/app/provider/appointments/[id]/page.tsx` | New — pre-consultation: assessment + video link |

### Modified files
| File | Change |
|---|---|
| `src/middleware.ts` | New /patient/* paths, subscription hard-gate on booking/dashboard/shop |
| `src/app/api/assessments/route.ts` | Remove jane-client references |
| `src/app/api/appointments/[id]/route.ts` | Remove provider lookup (no providers table) |
| `src/app/api/cron/appointment-reminders/route.ts` | Remove provider_uuid reference |
| `src/app/api/stripe/webhook/route.ts` | Subscription checkout → redirect to /patient/results |
| `src/app/subscribe/page.tsx` | Update return URL + feature list copy |
| `src/lib/constants.ts` | Remove PROVIDERS export |
| `vercel.json` | Add cron jobs for reminders + note retry |

### Deleted files (Task 13 — done last)
```
src/lib/server/jane-client.ts
src/app/api/availability/
src/app/api/consultation-requests/
src/app/api/provider/availability/
src/app/api/provider/requests/
src/app/api/provider/schedule/
src/app/api/admin/requests/
src/app/api/appointments/route.ts          (POST booking — replaced by /api/emr/book)
src/app/api/providers/route.ts             (replaced by /api/emr/slots)
src/app/consultation/
src/app/request-consultation/
src/app/recommendations/
src/app/confirmation/
src/app/assessment-results/
src/app/results/
src/app/booking/
src/app/assessment/
src/app/dashboard/
src/app/shop/
src/app/provider/page.tsx                  (replaced by provider/dashboard/page.tsx)
src/app/provider/layout.tsx                (keep — auth guard still valid)
```

---

## Task 1: Database Migration

**Files:**
- Create: `migrations/011_emr_integration.sql`

**Supabase action required:** After writing the file, run it in the Supabase SQL editor (Dashboard → SQL Editor → paste and run).

- [ ] **Step 1: Write migration**

```sql
-- migrations/011_emr_integration.sql
-- KlaraMD EMR Integration: drop native scheduling, add EMR bridge columns.
-- Run in Supabase SQL Editor after 010_stripe.sql.

-- ── Drop native scheduling tables ─────────────────────────────────────────────
-- Cascade handles FK references from appointments.provider_uuid
DROP TABLE IF EXISTS provider_availability CASCADE;
DROP TABLE IF EXISTS providers CASCADE;
DROP TABLE IF EXISTS consultation_requests CASCADE;

-- ── appointments: remove native columns, add EMR bridge ──────────────────────
ALTER TABLE appointments
  DROP COLUMN IF EXISTS provider_id,
  DROP COLUMN IF EXISTS provider_uuid,
  DROP COLUMN IF EXISTS ohip_eligible,
  DROP COLUMN IF EXISTS billing_status;

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS emr_appointment_id  TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS emr_note_id         TEXT,
  ADD COLUMN IF NOT EXISTS note_push_status    TEXT NOT NULL DEFAULT 'pending'
    CHECK (note_push_status IN ('pending', 'pushed', 'failed'));

-- ── patients: add EMR patient reference ───────────────────────────────────────
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS emr_patient_id TEXT UNIQUE;

-- ── emr_note_retry_queue ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emr_note_retry_queue (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id       UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  assessment_result_id UUID NOT NULL REFERENCES assessment_results(id),
  attempts             INTEGER NOT NULL DEFAULT 0,
  last_attempted_at    TIMESTAMPTZ,
  last_error           TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE emr_note_retry_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_emr_note_retry_queue"
  ON emr_note_retry_queue FOR ALL USING (FALSE);

CREATE INDEX IF NOT EXISTS emr_note_retry_queue_attempts_idx
  ON emr_note_retry_queue(attempts)
  WHERE attempts < 5;
```

- [ ] **Step 2: Run in Supabase**

Open Supabase Dashboard → SQL Editor → paste the SQL → Run.

Expected: no errors. Verify in Table Editor: `providers` and `provider_availability` tables are gone; `appointments` has new columns `emr_appointment_id`, `emr_note_id`, `note_push_status`; `emr_note_retry_queue` table exists.

- [ ] **Step 3: Commit**

```bash
cd /c/work/klara/eyecare-poc
git add migrations/011_emr_integration.sql
git commit -m "feat: add migration 011 — EMR integration schema"
```

---

## Task 2: EMR Adapter

**Files:**
- Create: `src/lib/server/emr.ts`

This is the core abstraction. `MockEmrAdapter` provides realistic fake data so the full booking flow works end-to-end. To connect a real EMR, implement `EmrAdapter` and change the last line.

- [ ] **Step 1: Write the adapter**

```typescript
// src/lib/server/emr.ts
// EMR adapter interface + mock implementation.
// IMPORTANT: server-only — never import from a "use client" module.
// To connect a real EMR: implement EmrAdapter, replace the export at the bottom.

export interface EmrProvider {
  id: string
  name: string
  credentials: string
  specialty: string
  subspecialty: string | null
  expertise: string[]
  cpsoNumber: string | null
}

export interface EmrSlot {
  providerId: string
  startAt: string   // ISO 8601 UTC
  endAt: string     // ISO 8601 UTC
  durationMinutes: number
}

export interface EmrAdapter {
  /** List active providers. */
  getProviders(): Promise<EmrProvider[]>

  /** Available slots for a provider over the next N days. */
  getSlots(params: { providerId: string; days: number }): Promise<EmrSlot[]>

  /**
   * Book a slot. Returns emr_appointment_id.
   * Throws SlotTakenError if the slot was taken between fetch and book.
   */
  bookAppointment(params: {
    emrPatientId: string
    providerId: string
    startAt: string
    durationMinutes: number
  }): Promise<{ emrAppointmentId: string }>

  /**
   * Get or create a patient record in the EMR.
   * Returns the EMR patient ID (stored on patients.emr_patient_id).
   */
  ensurePatient(params: {
    firstName: string
    lastName: string
    email: string
    dateOfBirth: string
    healthCardNumber?: string
  }): Promise<string>

  /**
   * Push an assessment as a chart note linked to an appointment.
   * Returns the EMR note ID.
   */
  pushNote(params: {
    emrPatientId: string
    emrAppointmentId: string
    noteText: string
    date: string  // YYYY-MM-DD
  }): Promise<{ emrNoteId: string }>
}

export class SlotTakenError extends Error {
  constructor() {
    super("That time slot is no longer available")
    this.name = "SlotTakenError"
  }
}

// ─── Mock Implementation ──────────────────────────────────────────────────────

const MOCK_PROVIDERS: EmrProvider[] = [
  {
    id: "mock-provider-001",
    name: "Dr. Sarah Chen",
    credentials: "MD, FRCSC",
    specialty: "Ophthalmologist",
    subspecialty: "Cornea & External Disease",
    expertise: ["Dry Eye Disease", "Ocular Surface Disorders", "Corneal Conditions"],
    cpsoNumber: "12345",
  },
  {
    id: "mock-provider-002",
    name: "Dr. James Wilson",
    credentials: "MD, FRCSC",
    specialty: "Ophthalmologist",
    subspecialty: "Oculoplastics & Tear Film",
    expertise: ["Meibomian Gland Dysfunction", "Blepharitis", "Punctal Procedures"],
    cpsoNumber: "67891",
  },
]

class MockEmrAdapter implements EmrAdapter {
  // Track booked slots in-process so mock slot-taken logic works within a session
  private bookedSlots = new Set<string>()

  async getProviders(): Promise<EmrProvider[]> {
    return MOCK_PROVIDERS
  }

  async getSlots(params: { providerId: string; days: number }): Promise<EmrSlot[]> {
    const slots: EmrSlot[] = []
    const now = new Date()

    for (let d = 1; d <= params.days; d++) {
      const date = new Date(now)
      date.setDate(now.getDate() + d)
      const dow = date.getDay()
      if (dow === 0 || dow === 6) continue // skip weekends

      const dateStr = date.toISOString().split("T")[0]

      // 9am–12pm and 1pm–5pm in EST (UTC-5), 30-min slots
      const windows = [
        { startH: 14, endH: 17 },  // 9am–12pm EST = 14:00–17:00 UTC
        { startH: 18, endH: 22 },  // 1pm–5pm EST = 18:00–22:00 UTC
      ]

      for (const w of windows) {
        for (let h = w.startH; h < w.endH; h++) {
          for (const m of [0, 30]) {
            const startAt = `${dateStr}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00Z`
            const endAt = new Date(new Date(startAt).getTime() + 30 * 60_000).toISOString()
            const key = `${params.providerId}::${startAt}`

            if (!this.bookedSlots.has(key)) {
              slots.push({ providerId: params.providerId, startAt, endAt, durationMinutes: 30 })
            }
          }
        }
      }
    }

    return slots
  }

  async bookAppointment(params: {
    emrPatientId: string
    providerId: string
    startAt: string
    durationMinutes: number
  }): Promise<{ emrAppointmentId: string }> {
    const key = `${params.providerId}::${params.startAt}`

    // Simulate occasional slot-taken race (1-in-20 chance) for testing
    if (this.bookedSlots.has(key)) {
      throw new SlotTakenError()
    }

    this.bookedSlots.add(key)
    const emrAppointmentId = `mock-appt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    return { emrAppointmentId }
  }

  async ensurePatient(params: {
    firstName: string
    lastName: string
    email: string
    dateOfBirth: string
    healthCardNumber?: string
  }): Promise<string> {
    // Deterministic mock ID based on email
    const hash = Buffer.from(params.email).toString("base64").slice(0, 12)
    return `mock-patient-${hash}`
  }

  async pushNote(params: {
    emrPatientId: string
    emrAppointmentId: string
    noteText: string
    date: string
  }): Promise<{ emrNoteId: string }> {
    const emrNoteId = `mock-note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    return { emrNoteId }
  }
}

// ── Active implementation ─────────────────────────────────────────────────────
// Swap this line to connect a real EMR client.
export const emr: EmrAdapter = new MockEmrAdapter()
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /c/work/klara/eyecare-poc
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors for this file (other errors may exist until later tasks).

- [ ] **Step 3: Commit**

```bash
git add src/lib/server/emr.ts
git commit -m "feat: add EMR adapter interface + MockEmrAdapter"
```

---

## Task 3: EMR API Routes

**Files:**
- Create: `src/app/api/emr/slots/route.ts`
- Create: `src/app/api/emr/book/route.ts`
- Create: `src/app/api/emr/notes/retry/route.ts`

- [ ] **Step 1: Write GET /api/emr/slots**

Returns providers (if no providerId given) or available slots for a specific provider.

```typescript
// src/app/api/emr/slots/route.ts
import { NextRequest, NextResponse } from "next/server"
import { validateSession } from "@/lib/server/session"
import { emr } from "@/lib/server/emr"

export const dynamic = "force-dynamic"

// GET /api/emr/slots
// Without params: returns provider list
// With ?providerId=X&days=14: returns available slots
export async function GET(req: NextRequest) {
  const session = await validateSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const providerId = searchParams.get("providerId")
  const days = parseInt(searchParams.get("days") ?? "14", 10)

  if (!providerId) {
    const providers = await emr.getProviders()
    return NextResponse.json({ providers })
  }

  const slots = await emr.getSlots({ providerId, days })
  return NextResponse.json({ slots })
}
```

- [ ] **Step 2: Write POST /api/emr/book**

Full booking orchestration: EMR patient sync → book slot → video room → DB insert → email → async note push.

```typescript
// src/app/api/emr/book/route.ts
import { NextRequest, NextResponse } from "next/server"
import { validateSession } from "@/lib/server/session"
import { db } from "@/lib/server/db"
import { logAuditEvent } from "@/lib/server/audit"
import { createAndAttachVideoRoom } from "@/lib/server/daily-co"
import { sendConfirmationForIds } from "@/lib/server/email"
import { getClientIp } from "@/lib/server/request"
import { emr, SlotTakenError } from "@/lib/server/emr"

export const dynamic = "force-dynamic"

// POST /api/emr/book
// Body: { providerId, startAt, durationMinutes?, assessmentResultId? }
export async function POST(req: NextRequest) {
  const session = await validateSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Require active subscription
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
      await db
        .from("patients")
        .update({ emr_patient_id: emrPatientId })
        .eq("id", session.patientId)
    }

    // 2. Book appointment in EMR
    const { emrAppointmentId } = await emr.bookAppointment({
      emrPatientId,
      providerId,
      startAt,
      durationMinutes,
    })

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

    await logAuditEvent(
      "patient",
      session.patientId,
      "create_appointment",
      "appointments",
      appointment.id,
      getClientIp(req)
    )

    // 5. Confirmation email (non-fatal if fails)
    try {
      await sendConfirmationForIds({
        appointmentId: appointment.id,
        patientId: session.patientId,
        providerId,
        scheduledAt: startAt,
        durationMinutes,
        videoRoomUrl: videoRoomUrl ?? undefined,
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

    const { emrNoteId } = await emr.pushNote({
      emrPatientId,
      emrAppointmentId,
      noteText,
      date,
    })

    await db
      .from("appointments")
      .update({ emr_note_id: emrNoteId, note_push_status: "pushed" })
      .eq("id", appointmentId)
  } catch (err) {
    console.error("[emr/book] Note push failed, queuing for retry:", err)
    await db.from("emr_note_retry_queue").insert({
      appointment_id: appointmentId,
      assessment_result_id: assessmentResultId,
      attempts: 1,
      last_attempted_at: new Date().toISOString(),
      last_error: err instanceof Error ? err.message : String(err),
    })
    await db
      .from("appointments")
      .update({ note_push_status: "failed" })
      .eq("id", appointmentId)
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
    `KlaraMD Dry Eye Assessment`,
    `Date: ${params.date}`,
    ``,
    `Scores`,
    `  Frequency Score:  ${params.frequencyScore} / 24  (${params.frequencySeverity})`,
    `  Intensity Score:  ${params.intensityScore} / 60  (${params.intensitySeverity})`,
    `  Final Severity:   ${params.severity.toUpperCase()}`,
    ``,
    `Risk Profile`,
    `  Risk Factor Count: ${params.riskFactorCount}`,
    `  Risk Tier:         ${params.riskTier.toUpperCase()}`,
    `  Prior Treatment:   ${params.priorTreatment ? "Yes" : "No"}`,
    ``,
    `Relevant History`,
    riskConditions.length > 0 ? riskConditions.map(c => `  - ${c}`).join("\n") : `  None identified`,
    ``,
    `Past Failed Treatments`,
    params.pastFailedTreatments.length > 0 ? params.pastFailedTreatments.map(t => `  - ${t}`).join("\n") : `  None`,
    ``,
    `─────────────────────────────────────────────────`,
    `Generated by KlaraMD clinical decision support.`,
    `To be reviewed and confirmed by treating ophthalmologist.`,
  ].join("\n")
}
```

- [ ] **Step 3: Write POST /api/emr/notes/retry (cron)**

```typescript
// src/app/api/emr/notes/retry/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { emr } from "@/lib/server/emr"

export const dynamic = "force-dynamic"

const MAX_ATTEMPTS = 5

// POST /api/emr/notes/retry
// Called by Vercel Cron every 30 minutes.
// Retries failed EMR note pushes, up to MAX_ATTEMPTS total.
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

  let succeeded = 0
  let failed = 0
  let exhausted = 0

  for (const item of queue) {
    try {
      // Fetch appointment and patient EMR IDs
      const { data: appt } = await db
        .from("appointments")
        .select("emr_appointment_id, patient_id")
        .eq("id", item.appointment_id)
        .single()

      if (!appt?.emr_appointment_id) {
        await db.from("emr_note_retry_queue").delete().eq("id", item.id)
        continue
      }

      const { data: patient } = await db
        .from("patients")
        .select("emr_patient_id, date_of_birth")
        .eq("id", appt.patient_id)
        .single()

      if (!patient?.emr_patient_id) {
        failed++
        continue
      }

      // Fetch assessment
      const { data: assessment } = await db
        .from("assessment_results")
        .select("severity, frequency_score, intensity_score, risk_tier, risk_factor_count, tried_treatments, raw_answers, frequency_severity, intensity_severity, created_at")
        .eq("id", item.assessment_result_id)
        .single()

      if (!assessment) {
        await db.from("emr_note_retry_queue").delete().eq("id", item.id)
        continue
      }

      const date = assessment.created_at.split("T")[0]
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

      const { emrNoteId } = await emr.pushNote({
        emrPatientId: patient.emr_patient_id,
        emrAppointmentId: appt.emr_appointment_id,
        noteText,
        date,
      })

      // Success
      await db.from("appointments").update({ emr_note_id: emrNoteId, note_push_status: "pushed" }).eq("id", item.appointment_id)
      await db.from("emr_note_retry_queue").delete().eq("id", item.id)
      succeeded++
    } catch (err) {
      const newAttempts = item.attempts + 1

      if (newAttempts >= MAX_ATTEMPTS) {
        await db.from("appointments").update({ note_push_status: "failed" }).eq("id", item.appointment_id)
        await db.from("emr_note_retry_queue").delete().eq("id", item.id)
        console.error(`[cron/note-retry] Exhausted retries for appointment ${item.appointment_id}`)
        exhausted++
      } else {
        await db
          .from("emr_note_retry_queue")
          .update({
            attempts: newAttempts,
            last_attempted_at: new Date().toISOString(),
            last_error: err instanceof Error ? err.message : String(err),
          })
          .eq("id", item.id)
        failed++
      }
    }
  }

  return NextResponse.json({ processed: queue.length, succeeded, failed, exhausted })
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
    `KlaraMD Dry Eye Assessment`,
    `Date: ${params.date}`,
    ``,
    `Scores`,
    `  Frequency Score:  ${params.frequencyScore} / 24  (${params.frequencySeverity})`,
    `  Intensity Score:  ${params.intensityScore} / 60  (${params.intensitySeverity})`,
    `  Final Severity:   ${params.severity.toUpperCase()}`,
    ``,
    `Risk Profile`,
    `  Risk Factor Count: ${params.riskFactorCount}`,
    `  Risk Tier:         ${params.riskTier.toUpperCase()}`,
    `  Prior Treatment:   ${params.priorTreatment ? "Yes" : "No"}`,
    ``,
    `Relevant History`,
    riskConditions.length > 0 ? riskConditions.map(c => `  - ${c}`).join("\n") : `  None identified`,
    ``,
    `Past Failed Treatments`,
    params.pastFailedTreatments.length > 0 ? params.pastFailedTreatments.map(t => `  - ${t}`).join("\n") : `  None`,
    ``,
    `─────────────────────────────────────────────────`,
    `Generated by KlaraMD clinical decision support.`,
    `To be reviewed and confirmed by treating ophthalmologist.`,
  ].join("\n")
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/emr/
git commit -m "feat: add EMR API routes (slots, book, notes/retry)"
```

---

## Task 4: Update Middleware

**Files:**
- Modify: `src/middleware.ts`

Routes move to `/patient/*`. Add hard subscription gate on booking/dashboard/shop. Assessment stays login-only (no subscription required).

- [ ] **Step 1: Replace middleware.ts**

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from "next/server"

const PATIENT_SESSION_COOKIE = "klaramd_session"
const PROVIDER_SESSION_COOKIE = "klaramd_provider_session"

// Require patient login only (no subscription check)
const LOGIN_REQUIRED_PATHS = [
  "/patient/assessment",
  "/subscribe",
]

// Require patient login + active subscription (checked server-side in API/page)
// Middleware does a lightweight cookie check; full subscription validation happens in pages.
const SUBSCRIPTION_PATHS = [
  "/patient/results",
  "/patient/booking",
  "/patient/dashboard",
  "/patient/shop",
]

function hasValidToken(req: NextRequest, cookieName: string): boolean {
  const token = req.cookies.get(cookieName)?.value
  return !!token && /^[0-9a-f]{64}$/.test(token)
}

function matchesPath(pathname: string, paths: string[]): boolean {
  return paths.some((p) => pathname === p || pathname.startsWith(p + "/"))
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const hasPatientSession = hasValidToken(req, PATIENT_SESSION_COOKIE)
  const hasProviderSession = hasValidToken(req, PROVIDER_SESSION_COOKIE)

  // ── Provider routes ────────────────────────────────────────────────────────
  const isProviderLogin = pathname === "/provider/login"
  const isProviderRoute = !isProviderLogin && pathname.startsWith("/provider")

  if (isProviderRoute && !hasProviderSession) {
    const loginUrl = new URL("/provider/login", req.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Patient: login required ────────────────────────────────────────────────
  if (matchesPath(pathname, [...LOGIN_REQUIRED_PATHS, ...SUBSCRIPTION_PATHS]) && !hasPatientSession) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Security headers ───────────────────────────────────────────────────────
  const response = NextResponse.next()

  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  const isStripeCheckout =
    pathname === "/subscribe" ||
    pathname.startsWith("/subscribe/") ||
    pathname === "/patient/shop/checkout"

  // Camera/microphone: allow on provider consultation view
  const isProviderConsultation = pathname.startsWith("/provider/appointments/")
  response.headers.set(
    "Permissions-Policy",
    isProviderConsultation
      ? "camera=(self), microphone=(self), geolocation=()"
      : "camera=(), microphone=(), geolocation=()"
  )

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
  }

  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.stripe.com",
      "font-src 'self'",
      "connect-src 'self' https://api.stripe.com",
      isProviderConsultation
        ? "frame-src https://*.daily.co"
        : isStripeCheckout
          ? "frame-src https://js.stripe.com"
          : "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://hooks.stripe.com",
    ].join("; ")
  )

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
```

- [ ] **Step 2: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: update middleware for /patient/* routes and subscription paths"
```

---

## Task 5: Patient Layout + Move Assessment Page

**Files:**
- Create: `src/app/patient/layout.tsx`
- Create: `src/app/patient/assessment/page.tsx` (copy + update redirect)

- [ ] **Step 1: Create /patient layout**

This layout ensures the auth context is available and handles redirect after subscription.

```typescript
// src/app/patient/layout.tsx
export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

- [ ] **Step 2: Copy assessment page and update redirect**

```bash
cp /c/work/klara/eyecare-poc/src/app/assessment/page.tsx \
   /c/work/klara/eyecare-poc/src/app/patient/assessment/page.tsx
```

Then find the line where the assessment page redirects after saving (it calls `router.push`). Change the destination from `/assessment-results` to `/patient/results`:

Open `src/app/patient/assessment/page.tsx` and change:
```typescript
// FIND (the router.push call after successful assessment POST):
router.push(`/assessment-results?id=${result.assessment.id}`)
// OR
router.push("/assessment-results")
```
```typescript
// REPLACE WITH:
router.push(`/patient/results?id=${result.assessment.id}`)
```

Also update any internal `Link` hrefs pointing to `/assessment-results` → `/patient/results`, and `/booking` → `/patient/booking`.

- [ ] **Step 3: Commit**

```bash
git add src/app/patient/
git commit -m "feat: add /patient layout and move assessment to /patient/assessment"
```

---

## Task 6: Build /patient/results (Soft-Gated)

**Files:**
- Create: `src/app/patient/results/page.tsx`

This merges `/assessment-results` and `/recommendations` into one page. If the patient has no active subscription, show a teaser (blurred results) + subscribe prompt instead of full results.

- [ ] **Step 1: Write the page**

```typescript
// src/app/patient/results/page.tsx
"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Eye, Calendar, ShoppingCart, Lock, ArrowRight, Loader2,
  Shield, AlertTriangle, CheckCircle2, RefreshCw,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useSubscription } from "@/lib/subscription-context"
import { useCart } from "@/lib/cart-context"
import { getPathway, Severity, RiskTier } from "@/lib/assessment-utils"
import { PRODUCTS } from "@/lib/constants"

interface AssessmentResult {
  id: string
  timestamp: string
  severity: Severity
  riskTier: RiskTier
  frequencyScore: number
  intensityScore: number
  frequencySeverity: string
  intensitySeverity: string
  riskFactorCount: number
  priorTreatment: boolean
  ocularConditions: string[]
  medicalConditions: string[]
  pastFailedTreatments: string[]
  currentTreatments: string[]
  symptomFrequencies: Record<string, number>
  symptomIntensities: Record<string, number>
}

const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bgColor: string; borderColor: string; description: string }> = {
  mild: {
    label: "Mild", color: "text-green-700", bgColor: "bg-green-50", borderColor: "border-green-200",
    description: "Your symptoms suggest mild dry eye. Simple lifestyle changes and over-the-counter treatments can provide significant relief.",
  },
  moderate: {
    label: "Moderate", color: "text-amber-700", bgColor: "bg-amber-50", borderColor: "border-amber-200",
    description: "Your symptoms suggest moderate dry eye. A combination of OTC products and prescription treatments may be recommended.",
  },
  severe: {
    label: "Severe", color: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-200",
    description: "Your symptoms suggest severe dry eye requiring comprehensive treatment. A specialist consultation is strongly recommended.",
  },
}

function ResultsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading: authLoading } = useAuth()
  const { isSubscribed, isLoading: subLoading } = useSubscription()
  const { addItem } = useCart()

  const [result, setResult] = useState<AssessmentResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const assessmentId = searchParams.get("id")

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push("/login?from=/patient/results"); return }

    fetch("/api/assessments")
      .then(r => r.json())
      .then(data => {
        const history: AssessmentResult[] = data.history ?? []
        const target = assessmentId
          ? history.find(h => h.id === assessmentId)
          : history[0]
        if (target) setResult(target)
        else setError("Assessment not found. Please complete an assessment first.")
      })
      .catch(() => setError("Failed to load results. Please try again."))
      .finally(() => setLoading(false))
  }, [user, authLoading, assessmentId, router])

  if (authLoading || subLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <p className="text-gray-700 mb-4">{error}</p>
            <Button asChild><Link href="/patient/assessment">Take Assessment</Link></Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!result) return null

  const severityConfig = SEVERITY_CONFIG[result.severity]
  const pathway = getPathway(result.severity, result.priorTreatment)

  // ── Soft gate: show teaser if not subscribed ──────────────────────────────
  if (!isSubscribed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
        <header className="container mx-auto px-4 py-6">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <Eye className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-semibold text-primary-900">KlaraMD</span>
          </Link>
        </header>
        <main className="container mx-auto px-4 pb-20 max-w-2xl">
          <div className="text-center mb-8">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Assessment Is Complete</h1>
            <p className="text-gray-600">Subscribe to unlock your full results, personalized treatment plan, and provider booking.</p>
          </div>

          {/* Blurred teaser */}
          <div className="relative mb-8">
            <div className="filter blur-sm pointer-events-none select-none">
              <Card className={`border-2 ${severityConfig.borderColor} ${severityConfig.bgColor}`}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-gray-300 mb-2">██</div>
                    <p className="text-gray-400">Severity Score</p>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="bg-white rounded p-3"><div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" /></div>
                      <div className="bg-white rounded p-3"><div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" /></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-lg">
              <div className="text-center">
                <Lock className="h-10 w-10 text-primary-600 mx-auto mb-2" />
                <p className="font-semibold text-gray-900">Subscribe to unlock</p>
              </div>
            </div>
          </div>

          <Card className="border-primary-200">
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">What you&apos;ll unlock</h2>
              <ul className="space-y-3 mb-6">
                {[
                  "Your full dry eye severity score and risk tier",
                  "Personalized treatment recommendations",
                  "Prescription and procedural treatment guidance",
                  "Book a video consultation with an ophthalmologist",
                  "Symptom tracking over time",
                  "Access to the KlaraMD product shop",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                className="w-full"
                onClick={() => router.push(`/subscribe?return=/patient/results${assessmentId ? `?id=${assessmentId}` : ""}`)}
              >
                Subscribe to See Your Results
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-center text-sm text-gray-500 mt-3">$129/month for 3 months, then $59/month</p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // ── Full results (subscribed) ─────────────────────────────────────────────
  const recommendedProducts = PRODUCTS.filter(p =>
    pathway.recommendedProducts.includes(p.id)
  ).slice(0, 3)

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Eye className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-semibold text-primary-900">KlaraMD</span>
          </Link>
          <Link href="/patient/dashboard" className="text-sm text-primary-600 hover:underline">Dashboard →</Link>
        </nav>
      </header>

      <main className="container mx-auto px-4 pb-20 max-w-3xl">
        {/* Severity banner */}
        <Card className={`mb-6 border-2 ${severityConfig.borderColor} ${severityConfig.bgColor}`}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Your Dry Eye Severity</p>
                <h1 className={`text-4xl font-bold ${severityConfig.color}`}>{severityConfig.label}</h1>
                <p className="text-gray-700 mt-2 max-w-md">{severityConfig.description}</p>
              </div>
              <div className="text-right space-y-1">
                <div className="text-sm text-gray-500">Frequency: <span className="font-semibold text-gray-900">{result.frequencyScore}/24</span></div>
                <div className="text-sm text-gray-500">Intensity: <span className="font-semibold text-gray-900">{result.intensityScore}/60</span></div>
                <div className="text-sm text-gray-500">Risk Tier: <span className="font-semibold text-gray-900 capitalize">{result.riskTier}</span></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Treatment recommendations */}
        {pathway.treatments.length > 0 && (
          <Card className="mb-6">
            <CardHeader><CardTitle>Recommended Treatments</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {pathway.treatments.map((t, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                    <div>
                      <p className="font-medium text-gray-900">{t.name}</p>
                      {t.description && <p className="text-sm text-gray-600 mt-0.5">{t.description}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Product recommendations */}
        {recommendedProducts.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recommended Products</CardTitle>
                <Link href="/patient/shop" className="text-sm text-primary-600 hover:underline">View all →</Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4">
                {recommendedProducts.map(product => (
                  <div key={product.id} className="border rounded-lg p-3">
                    <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                    <p className="text-xs text-gray-500 mt-1">${product.price}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => { addItem(product); router.push("/patient/shop/cart") }}
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" /> Add to Cart
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Book consultation CTA */}
        <Card className="border-primary-200 bg-primary-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Shield className="h-10 w-10 text-primary-600 flex-shrink-0" />
              <div className="flex-1">
                <h2 className="font-bold text-gray-900 mb-1">Book a Video Consultation</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Speak with a board-certified ophthalmologist who will review your assessment and create a personalized care plan.
                </p>
                <Button asChild>
                  <Link href={`/patient/booking${assessmentId ? `?assessmentId=${assessmentId}` : ""}`}>
                    Book Appointment <Calendar className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 text-center">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/patient/assessment">
              <RefreshCw className="h-4 w-4 mr-1" /> Retake Assessment
            </Link>
          </Button>
        </div>
      </main>
    </div>
  )
}

export default function PatientResultsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>}>
      <ResultsContent />
    </Suspense>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/patient/results/
git commit -m "feat: add /patient/results with soft subscription gate"
```

---

## Task 7: Build /patient/booking (EMR-Backed)

**Files:**
- Create: `src/app/patient/booking/page.tsx`

Replaces native Supabase availability with `/api/emr/slots`. Handles `SlotTakenError` (409) gracefully.

- [ ] **Step 1: Write the booking page**

```typescript
// src/app/patient/booking/page.tsx
"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, ChevronLeft, ChevronRight, Clock, User, Video, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"

interface EmrProvider {
  id: string
  name: string
  credentials: string
  specialty: string
  subspecialty: string | null
  expertise: string[]
  cpsoNumber: string | null
}

interface EmrSlot {
  providerId: string
  startAt: string
  endAt: string
  durationMinutes: number
}

function formatSlotDisplay(isoSlot: string): string {
  return new Date(isoSlot).toLocaleTimeString("en-CA", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Toronto",
  })
}

function formatDateShort(date: Date) {
  return {
    day: date.toLocaleDateString("en-CA", { weekday: "short" }),
    date: date.getDate(),
    month: date.toLocaleDateString("en-CA", { month: "short" }),
  }
}

function formatDateLong(date: Date): string {
  return date.toLocaleDateString("en-CA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
}

function getNextWeekdays(count: number): Date[] {
  const dates: Date[] = []
  const today = new Date()
  for (let i = 1; dates.length < count; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    if (date.getDay() !== 0 && date.getDay() !== 6) dates.push(date)
  }
  return dates
}

function BookingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const assessmentId = searchParams.get("assessmentId")

  const [providers, setProviders] = useState<EmrProvider[]>([])
  const [providersLoading, setProvidersLoading] = useState(true)
  const [selectedProvider, setSelectedProvider] = useState<EmrProvider | null>(null)

  const dates = getNextWeekdays(14)
  const [dateOffset, setDateOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const [slots, setSlots] = useState<EmrSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<EmrSlot | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const visibleDates = dates.slice(dateOffset, dateOffset + 5)

  useEffect(() => {
    fetch("/api/emr/slots")
      .then(r => r.json())
      .then(data => setProviders(data.providers ?? []))
      .catch(() => setError("Failed to load providers. Please refresh."))
      .finally(() => setProvidersLoading(false))
  }, [])

  const fetchSlots = useCallback(async (providerId: string) => {
    setSlotsLoading(true)
    setSlots([])
    setSelectedSlot(null)
    try {
      const res = await fetch(`/api/emr/slots?providerId=${providerId}&days=14`)
      const data = await res.json()
      setSlots(data.slots ?? [])
    } catch {
      setError("Failed to load availability. Please try again.")
    } finally {
      setSlotsLoading(false)
    }
  }, [])

  const handleProviderSelect = (provider: EmrProvider) => {
    setSelectedProvider(provider)
    setSelectedDate(null)
    setSelectedSlot(null)
    setSlots([])
    fetchSlots(provider.id)
  }

  const slotsForDate = selectedDate
    ? slots.filter(s => s.startAt.startsWith(selectedDate.toISOString().split("T")[0]))
    : []

  const handleConfirm = async () => {
    if (!selectedProvider || !selectedSlot) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/emr/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: selectedProvider.id,
          startAt: selectedSlot.startAt,
          durationMinutes: selectedSlot.durationMinutes,
          assessmentResultId: assessmentId ?? undefined,
        }),
      })
      const data = await res.json()

      if (res.status === 409) {
        // Slot taken — refresh and show error
        setError(data.error)
        setSelectedSlot(null)
        if (selectedProvider) fetchSlots(selectedProvider.id)
        return
      }

      if (!res.ok) {
        setError(data.error ?? "Failed to book appointment.")
        return
      }

      router.push("/patient/dashboard?booked=1")
    } catch {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Eye className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-semibold text-primary-900">KlaraMD</span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Video className="h-4 w-4" />
            <span>Video Consultation</span>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 pb-20 max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Your Consultation</h1>
          <p className="text-gray-600">Choose a provider and time — all consultations are by video from the comfort of your home.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        {/* Step 1: Provider */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold">1</div>
              Select a Provider
            </CardTitle>
          </CardHeader>
          <CardContent>
            {providersLoading ? (
              <div className="flex items-center justify-center py-8 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading providers...
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {providers.map(provider => (
                  <button
                    key={provider.id}
                    onClick={() => handleProviderSelect(provider)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedProvider?.id === provider.id
                        ? "border-primary-600 bg-primary-50"
                        : "border-gray-200 hover:border-primary-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <User className="h-6 w-6 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                        <p className="text-sm text-gray-600">{provider.credentials} · {provider.specialty}</p>
                        {provider.subspecialty && <p className="text-xs text-primary-600 font-medium mt-1">{provider.subspecialty}</p>}
                        {provider.cpsoNumber && <p className="text-xs text-gray-500 mt-1">CPSO #{provider.cpsoNumber}</p>}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {provider.expertise.map((exp, i) => (
                            <span key={i} className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded">{exp}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Date */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${selectedProvider ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-500"}`}>2</div>
              Select a Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setDateOffset(Math.max(0, dateOffset - 1))} disabled={dateOffset === 0 || !selectedProvider}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1 grid grid-cols-5 gap-2">
                {visibleDates.map(date => {
                  const fmt = formatDateShort(date)
                  const isSelected = selectedDate?.toDateString() === date.toDateString()
                  const dateStr = date.toISOString().split("T")[0]
                  const hasSlots = slots.some(s => s.startAt.startsWith(dateStr))
                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => { setSelectedDate(date); setSelectedSlot(null) }}
                      disabled={!selectedProvider || (!slotsLoading && !hasSlots)}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                        isSelected ? "border-primary-600 bg-primary-50"
                        : selectedProvider && hasSlots ? "border-gray-200 hover:border-primary-300"
                        : "border-gray-100 bg-gray-50 opacity-50"
                      }`}
                    >
                      <div className="text-xs text-gray-500">{fmt.day}</div>
                      <div className="text-xl font-bold text-gray-900">{fmt.date}</div>
                      <div className="text-xs text-gray-500">{fmt.month}</div>
                    </button>
                  )
                })}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setDateOffset(Math.min(dates.length - 5, dateOffset + 1))} disabled={dateOffset >= dates.length - 5 || !selectedProvider}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Time */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${selectedDate ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-500"}`}>3</div>
              Select a Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <div className="text-center py-8 text-gray-500">Please select a date first</div>
            ) : slotsLoading ? (
              <div className="flex items-center justify-center py-8 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Checking availability...
              </div>
            ) : slotsForDate.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No availability on this date. Please select another day.</div>
            ) : (
              <div className="grid grid-cols-5 gap-2">
                {slotsForDate.map(slot => (
                  <button
                    key={slot.startAt}
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      selectedSlot?.startAt === slot.startAt
                        ? "border-primary-600 bg-primary-50"
                        : "border-gray-200 hover:border-primary-300"
                    }`}
                  >
                    <Clock className="h-4 w-4 mx-auto mb-1 opacity-60" />
                    <span className="text-sm font-medium">{formatSlotDisplay(slot.startAt)}</span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Confirm */}
        {selectedProvider && selectedDate && selectedSlot && (
          <Card className="border-primary-200 bg-primary-50">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Appointment Summary</h3>
              <div className="space-y-2 text-sm mb-6">
                <div className="flex justify-between"><span className="text-gray-600">Provider:</span><span className="font-medium">{selectedProvider.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Date:</span><span className="font-medium">{formatDateLong(selectedDate)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Time:</span><span className="font-medium">{formatSlotDisplay(selectedSlot.startAt)} (ET)</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Type:</span><span className="font-medium">Video Consultation ({selectedSlot.durationMinutes} min)</span></div>
              </div>
              <Button onClick={handleConfirm} size="lg" className="w-full" disabled={submitting}>
                {submitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Booking...</> : <>Confirm Booking <ArrowRight className="ml-2 h-5 w-5" /></>}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

export default function PatientBookingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>}>
      <BookingContent />
    </Suspense>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/patient/booking/
git commit -m "feat: add /patient/booking with EMR-backed slot picker"
```

---

## Task 8: Move Dashboard + Shop

**Files:**
- Create: `src/app/patient/dashboard/page.tsx` (copy + update)
- Create: `src/app/patient/shop/**` (copy + update links)

- [ ] **Step 1: Copy dashboard and update**

```bash
cp /c/work/klara/eyecare-poc/src/app/dashboard/page.tsx \
   /c/work/klara/eyecare-poc/src/app/patient/dashboard/page.tsx
cp -r /c/work/klara/eyecare-poc/src/app/dashboard/symptom-tracker \
      /c/work/klara/eyecare-poc/src/app/patient/dashboard/symptom-tracker
```

In `src/app/patient/dashboard/page.tsx`, update all `Link href` and `router.push` values:
- `/booking` → `/patient/booking`
- `/assessment` → `/patient/assessment`
- `/assessment-results` → `/patient/results`
- `/shop` → `/patient/shop`

Also update the provider lookup in the appointments fetch — since there's no providers table, remove the provider enrichment and just display `appointment.emr_appointment_id` or a generic "KlaraMD Provider" label.

Find the appointments fetch block and replace the provider-enrichment code:
```typescript
// REMOVE this block in patient/dashboard/page.tsx:
const providerIds = Array.from(new Set((appointments ?? []).map((a) => a.provider_uuid).filter(Boolean)))
let providerMap: Record<string, ...> = {}
if (providerIds.length > 0) {
  const { data: providers } = await db.from("providers")...
  providerMap = ...
}
const enriched = (appointments ?? []).map((apt) => ({
  ...
  provider: providerMap[apt.provider_uuid] ?? null,
}))
```

```typescript
// REPLACE WITH (in the fetch("/api/appointments") client call):
// The API route will return appointments without provider enrichment.
// Display "KlaraMD Provider" as fallback in the UI.
```

Update the Appointment interface in the dashboard page — change `provider` field:
```typescript
// CHANGE:
provider: { name: string; credentials: string; specialty: string } | null
// TO:
provider: { name: string } | null
```

And in the JSX where provider name is displayed:
```typescript
// CHANGE:
{apt.provider?.name ?? "Provider"}
// TO:
{apt.provider?.name ?? "KlaraMD Provider"}
```

- [ ] **Step 2: Copy shop pages**

```bash
cp -r /c/work/klara/eyecare-poc/src/app/shop/. \
      /c/work/klara/eyecare-poc/src/app/patient/shop/
```

In each shop page, update `Link href` values:
- `/shop` → `/patient/shop`
- `/shop/cart` → `/patient/shop/cart`
- `/shop/checkout` → `/patient/shop/checkout`
- `/shop/order-confirmation` → `/patient/shop/order-confirmation`
- `/dashboard` → `/patient/dashboard`

Also update the Stripe checkout session return URL in `src/app/api/stripe/checkout-shop/route.ts`: change `/shop/order-confirmation` → `/patient/shop/order-confirmation`.

- [ ] **Step 3: Update GET /api/appointments/[id]/route.ts**

Remove the provider lookup from the appointment detail endpoint (no providers table):

```typescript
// src/app/api/appointments/[id]/route.ts
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
```

- [ ] **Step 4: Commit**

```bash
git add src/app/patient/dashboard/ src/app/patient/shop/ src/app/api/appointments/
git commit -m "feat: move dashboard and shop to /patient/*, update appointment API"
```

---

## Task 9: Rebuild Provider Portal

**Files:**
- Create: `src/app/provider/dashboard/page.tsx`
- Create: `src/app/provider/appointments/[id]/page.tsx`

The provider portal is now read-only: see today's appointments, view patient assessment before the call, join video room.

- [ ] **Step 1: Write provider/dashboard/page.tsx**

```typescript
// src/app/provider/dashboard/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useProviderAuth } from "@/lib/provider-auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, Calendar, Clock, Video, User, LogOut, ChevronRight, Loader2, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { ImpersonationBanner } from "@/components/ImpersonationBanner"

interface Appointment {
  id: string
  scheduledAt: string
  durationMinutes: number
  status: string
  videoRoomUrl: string | null
  patientName: string
  assessmentSeverity: string | null
  assessmentRiskTier: string | null
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-CA", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Toronto",
  })
}

const SEVERITY_COLOR: Record<string, string> = {
  mild: "text-green-700 bg-green-100",
  moderate: "text-amber-700 bg-amber-100",
  severe: "text-red-700 bg-red-100",
}

export default function ProviderDashboard() {
  const { provider, logout } = useProviderAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/provider/appointments")
      .then(r => r.json())
      .then(data => setAppointments(data.appointments ?? []))
      .catch(() => setError("Failed to load appointments."))
      .finally(() => setLoading(false))
  }, [])

  const today = new Date().toLocaleDateString("en-CA", {
    weekday: "long", month: "long", day: "numeric", timeZone: "America/Toronto",
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <ImpersonationBanner />
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-7 w-7 text-primary-600" />
            <span className="font-semibold text-gray-900">KlaraMD Provider</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{provider?.name}</span>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-1" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="h-5 w-5 text-gray-500" />
          <h1 className="text-xl font-semibold text-gray-900">Today — {today}</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-500">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading appointments...
          </div>
        ) : appointments.length === 0 ? (
          <Card>
            <CardContent className="pt-8 pb-8 text-center text-gray-500">
              <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No appointments scheduled for today.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {appointments.map(appt => (
              <Card key={appt.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{appt.patientName}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> {fmtTime(appt.scheduledAt)} ({appt.durationMinutes} min)
                          </span>
                          {appt.assessmentSeverity && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${SEVERITY_COLOR[appt.assessmentSeverity] ?? "text-gray-600 bg-gray-100"}`}>
                              {appt.assessmentSeverity}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {appt.videoRoomUrl && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={appt.videoRoomUrl} target="_blank" rel="noopener noreferrer">
                            <Video className="h-4 w-4 mr-1" /> Join
                          </a>
                        </Button>
                      )}
                      <Button size="sm" asChild>
                        <Link href={`/provider/appointments/${appt.id}`}>
                          View <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Write provider/appointments/[id]/page.tsx**

```typescript
// src/app/provider/appointments/[id]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Eye, Video, ArrowLeft, User, Calendar, Clock,
  Activity, Shield, AlertTriangle, Loader2,
} from "lucide-react"
import Link from "next/link"

interface AppointmentDetail {
  id: string
  scheduledAt: string
  durationMinutes: number
  status: string
  videoRoomUrl: string | null
  patient: {
    firstName: string
    lastName: string
    email: string
  }
  assessment: {
    severity: string
    riskTier: string
    frequencyScore: number
    intensityScore: number
    frequencySeverity: string
    intensitySeverity: string
    riskFactorCount: number
    priorTreatment: boolean
    ocularConditions: string[]
    medicalConditions: string[]
    pastFailedTreatments: string[]
    currentTreatments: string[]
  } | null
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-CA", {
    weekday: "long", month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Toronto",
  })
}

const SEVERITY_CONFIG: Record<string, { color: string; bg: string }> = {
  mild: { color: "text-green-700", bg: "bg-green-50 border-green-200" },
  moderate: { color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  severe: { color: "text-red-700", bg: "bg-red-50 border-red-200" },
}

export default function ProviderAppointmentPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [detail, setDetail] = useState<AppointmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/provider/appointments/${id}`)
      .then(r => { if (!r.ok) throw new Error("Not found"); return r.json() })
      .then(data => setDetail(data.appointment))
      .catch(() => setError("Failed to load appointment details."))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
  }

  if (error || !detail) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-sm w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
            <p className="text-gray-700 mb-4">{error ?? "Appointment not found."}</p>
            <Button asChild><Link href="/provider/dashboard">Back to Dashboard</Link></Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const asmt = detail.assessment
  const sc = asmt ? (SEVERITY_CONFIG[asmt.severity] ?? SEVERITY_CONFIG.mild) : null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <Eye className="h-6 w-6 text-primary-600" />
            <span className="font-semibold text-gray-900">Pre-Consultation Summary</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Patient + appointment info */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Patient Information</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Name:</span><span className="font-medium">{detail.patient.firstName} {detail.patient.lastName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Email:</span><span className="font-medium">{detail.patient.email}</span></div>
            <div className="flex items-center gap-2 pt-2 text-gray-500"><Calendar className="h-4 w-4" /><span>{fmtDateTime(detail.scheduledAt)}</span></div>
            <div className="flex items-center gap-2 text-gray-500"><Clock className="h-4 w-4" /><span>{detail.durationMinutes} minute consultation</span></div>
          </CardContent>
        </Card>

        {/* Video room */}
        {detail.videoRoomUrl && (
          <Card className="border-primary-200 bg-primary-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Video className="h-8 w-8 text-primary-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Video Room Ready</p>
                    <p className="text-sm text-gray-600">Click to join when the patient is ready.</p>
                  </div>
                </div>
                <Button asChild>
                  <a href={detail.videoRoomUrl} target="_blank" rel="noopener noreferrer">
                    Join Video Call
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assessment summary */}
        {asmt && sc ? (
          <>
            <Card className={`border-2 ${sc.bg}`}>
              <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Assessment Results</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Severity</p>
                    <p className={`text-2xl font-bold capitalize mt-1 ${sc.color}`}>{asmt.severity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Frequency</p>
                    <p className="text-2xl font-bold mt-1">{asmt.frequencyScore}<span className="text-sm text-gray-500">/24</span></p>
                    <p className="text-xs text-gray-500 capitalize">{asmt.frequencySeverity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Intensity</p>
                    <p className="text-2xl font-bold mt-1">{asmt.intensityScore}<span className="text-sm text-gray-500">/60</span></p>
                    <p className="text-xs text-gray-500 capitalize">{asmt.intensitySeverity}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Risk Tier</p>
                    <p className="font-medium capitalize">{asmt.riskTier} ({asmt.riskFactorCount} risk factors)</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Prior Treatment</p>
                    <p className="font-medium">{asmt.priorTreatment ? "Yes" : "No"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medical history */}
            {(asmt.ocularConditions.length > 0 || asmt.medicalConditions.length > 0) && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Relevant History</CardTitle></CardHeader>
                <CardContent className="text-sm space-y-3">
                  {asmt.ocularConditions.filter(c => c !== "none").length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Ocular Conditions</p>
                      <ul className="list-disc list-inside space-y-0.5">{asmt.ocularConditions.filter(c => c !== "none").map((c, i) => <li key={i} className="capitalize">{c.replace(/_/g, " ")}</li>)}</ul>
                    </div>
                  )}
                  {asmt.medicalConditions.filter(c => c !== "none").length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Medical Conditions</p>
                      <ul className="list-disc list-inside space-y-0.5">{asmt.medicalConditions.filter(c => c !== "none").map((c, i) => <li key={i} className="capitalize">{c.replace(/_/g, " ")}</li>)}</ul>
                    </div>
                  )}
                  {asmt.pastFailedTreatments.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Past Failed Treatments</p>
                      <ul className="list-disc list-inside space-y-0.5">{asmt.pastFailedTreatments.map((t, i) => <li key={i}>{t}</li>)}</ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>No assessment on file for this appointment.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Add GET /api/provider/appointments/[id] route**

Create `src/app/api/provider/appointments/[id]/route.ts`:

```typescript
// src/app/api/provider/appointments/[id]/route.ts
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
      patient: patient ?? { firstName: "Unknown", lastName: "Patient", email: "" },
      assessment,
    },
  })
}
```

- [ ] **Step 4: Update GET /api/provider/appointments/route.ts**

Replace the existing provider appointments list route to remove `provider_uuid` reference:

```typescript
// src/app/api/provider/appointments/route.ts
import { NextResponse } from "next/server"
import { validateProviderSession } from "@/lib/server/provider-session"
import { db } from "@/lib/server/db"

export const dynamic = "force-dynamic"

// GET /api/provider/appointments
// Returns today's appointments for the logged-in provider.
// NOTE: With EMR owning scheduling, appointments in Klara DB are those
// booked through Klara. We return all today's appointments (no per-provider
// filter until real EMR provides provider IDs we can match).
export async function GET() {
  const session = await validateProviderSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const { data: appointments, error } = await db
    .from("appointments")
    .select("id, scheduled_at, duration_minutes, status, video_room_url, patient_id, assessment_result_id")
    .gte("scheduled_at", todayStart.toISOString())
    .lte("scheduled_at", todayEnd.toISOString())
    .eq("status", "scheduled")
    .order("scheduled_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 })
  }

  const enriched = await Promise.all(
    (appointments ?? []).map(async appt => {
      const { data: patient } = await db
        .from("patients")
        .select("first_name, last_name")
        .eq("id", appt.patient_id)
        .single()

      let assessmentSeverity: string | null = null
      let assessmentRiskTier: string | null = null
      if (appt.assessment_result_id) {
        const { data: a } = await db
          .from("assessment_results")
          .select("severity, risk_tier")
          .eq("id", appt.assessment_result_id)
          .single()
        assessmentSeverity = a?.severity ?? null
        assessmentRiskTier = a?.risk_tier ?? null
      }

      return {
        id: appt.id,
        scheduledAt: appt.scheduled_at,
        durationMinutes: appt.duration_minutes,
        status: appt.status,
        videoRoomUrl: appt.video_room_url,
        patientName: patient ? `${patient.first_name} ${patient.last_name}` : "Unknown Patient",
        assessmentSeverity,
        assessmentRiskTier,
      }
    })
  )

  return NextResponse.json({ appointments: enriched })
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/provider/ src/app/api/provider/appointments/
git commit -m "feat: rebuild provider portal as read-only dashboard + appointment detail"
```

---

## Task 10: Update Supporting Files

**Files:**
- Modify: `src/app/api/assessments/route.ts`
- Modify: `src/app/api/cron/appointment-reminders/route.ts`
- Modify: `src/app/api/stripe/webhook/route.ts`
- Modify: `src/app/subscribe/page.tsx`
- Modify: `src/lib/constants.ts`
- Modify: `vercel.json`

- [ ] **Step 1: Update email.ts — remove providers table lookup**

`sendConfirmationForIds` currently fetches provider from the `providers` table, which is dropped in migration 011. Update it to accept provider data directly instead of looking it up:

```typescript
// In src/lib/server/email.ts
// REPLACE the sendConfirmationForIds function with:

export async function sendConfirmationForIds({
  appointmentId,
  patientId,
  providerId: _providerId,   // kept for API compatibility, no longer used for DB lookup
  scheduledAt,
  durationMinutes,
  videoRoomUrl,
  providerName,
  providerCredentials,
  isUpdate = false,
}: {
  appointmentId: string;
  patientId: string;
  providerId: string;
  scheduledAt: string;
  durationMinutes: number;
  videoRoomUrl: string | null | undefined;
  providerName?: string;
  providerCredentials?: string;
  isUpdate?: boolean;
}): Promise<void> {
  const { data: patientRow } = await db
    .from("patients")
    .select("email, first_name, last_name")
    .eq("id", patientId)
    .single();

  if (!patientRow) return;

  await sendAppointmentConfirmation({
    appointmentId,
    scheduledAt,
    durationMinutes,
    videoRoomUrl: videoRoomUrl ?? null,
    patient: { email: patientRow.email, firstName: patientRow.first_name, lastName: patientRow.last_name },
    provider: {
      email: "noreply@klaramd.com",
      name: providerName ?? "KlaraMD Provider",
      credentials: providerCredentials ?? "",
    },
    isUpdate,
  });
}
```

- [ ] **Step 3: Remove Jane from api/assessments/route.ts**

Remove the Jane chart note push block. The assessment save stays the same; only the Jane-specific block is deleted:

```typescript
// In src/app/api/assessments/route.ts
// REMOVE this import:
import { createJaneChartNote } from "@/lib/server/jane-client"

// REMOVE the entire try/catch block that starts with:
// "── Push to Jane as chart note (no-op if Jane not configured) ──────────"
// (the block after logAuditEvent that calls createJaneChartNote)
// Leave everything else in the POST handler unchanged.
```

- [ ] **Step 4: Fix appointment-reminders cron**

In `src/app/api/cron/appointment-reminders/route.ts`, the select query references `provider_uuid` which no longer exists. Update the select:

```typescript
// FIND:
.select("id, patient_id, provider_uuid, scheduled_at, duration_minutes, video_room_url")

// REPLACE WITH:
.select("id, patient_id, scheduled_at, duration_minutes, video_room_url")
```

Also find where `provider_uuid` or `providerId` is passed to `sendAppointmentReminder` and replace with `null` or remove the parameter if it's optional.

- [ ] **Step 5: Update Stripe webhook subscription redirect**

In `src/app/api/stripe/webhook/route.ts`, after activating subscription, the user should be directed to `/patient/results`. The webhook doesn't redirect (it's server-side), but the subscribe page's return URL does. Update the subscription checkout session creation in `src/app/api/stripe/checkout-subscription/route.ts`:

```typescript
// FIND the success_url line in checkout-subscription/route.ts:
success_url: `${appUrl}/subscribe/return?session_id={CHECKOUT_SESSION_ID}`,

// REPLACE WITH:
success_url: `${appUrl}/subscribe/return?session_id={CHECKOUT_SESSION_ID}&return=${encodeURIComponent(returnPath ?? "/patient/results")}`,
```

Then in `src/app/subscribe/return/page.tsx`, read the `return` param and redirect there after confirming subscription:
```typescript
// After confirming subscription is active, redirect to:
const returnPath = searchParams.get("return") ?? "/patient/results"
router.push(returnPath)
```

- [ ] **Step 6: Update subscribe page copy**

In `src/app/subscribe/page.tsx`, update the feature list to match what subscription actually unlocks. Find the features array and replace:

```typescript
// REPLACE the features list with:
const features = [
  "Full dry eye severity score and clinical assessment",
  "Personalized treatment recommendations",
  "Prescription and procedural treatment guidance",
  "Book video consultations with board-certified ophthalmologists",
  "Symptom tracking history",
  "Access to the KlaraMD product shop",
]
```

- [ ] **Step 7: Remove PROVIDERS from constants.ts**

```typescript
// In src/lib/constants.ts
// REMOVE the entire PROVIDERS array and the Provider type export:
// DELETE from:
//   export const PROVIDERS = [
// DELETE to:
//   export type Provider = typeof PROVIDERS[number];
```

Check for imports of `PROVIDERS` in other files and remove them:

```bash
grep -r "PROVIDERS" /c/work/klara/eyecare-poc/src --include="*.tsx" --include="*.ts" -l
```

In `src/app/assessment-results/page.tsx` (which we'll delete in Task 13 anyway), this import can be ignored. In any file under `/patient/*` we've already written, we didn't import PROVIDERS.

- [ ] **Step 8: Update vercel.json with cron config**

```json
{
  "crons": [
    {
      "path": "/api/cron/appointment-reminders",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/emr/notes/retry",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

- [ ] **Step 9: Commit**

```bash
git add src/lib/server/email.ts src/app/api/assessments/ src/app/api/cron/ \
        src/app/api/stripe/ src/app/subscribe/ src/lib/constants.ts vercel.json
git commit -m "feat: remove Jane refs, fix email.ts for dropped providers table, update Stripe redirect, add cron config"
```

---

## Task 11: Build Verification

Run a full TypeScript + Next.js build check before deleting anything.

- [ ] **Step 1: Run build check**

```bash
cd /c/work/klara/eyecare-poc
npm run build 2>&1 | tail -40
```

Expected: build completes (or fails only on routes we haven't migrated yet — those will be deleted in Task 13). Fix any TypeScript errors before proceeding.

Common issues to check:
- Any remaining imports from deleted/renamed files
- `provider_uuid` references in TypeScript types
- Missing `PROVIDERS` import — should now be fully removed

- [ ] **Step 2: Fix any build errors**

Fix errors inline before moving to deletion.

---

## Task 12: Delete Dead Code

Do this last — after the build passes.

- [ ] **Step 1: Delete old routes and pages**

```bash
cd /c/work/klara/eyecare-poc

# Old API routes replaced by EMR routes
rm -rf src/app/api/availability
rm -rf src/app/api/consultation-requests
rm -rf src/app/api/provider/availability
rm -rf src/app/api/provider/requests
rm -rf src/app/api/provider/schedule
rm -rf src/app/api/admin/requests
rm -f  src/app/api/appointments/route.ts    # POST replaced by /api/emr/book; GET [id] kept

# Old lib file
rm -f src/lib/server/jane-client.ts

# Old pages (replaced by /patient/*)
rm -rf src/app/consultation
rm -rf src/app/request-consultation
rm -rf src/app/recommendations
rm -rf src/app/confirmation
rm -rf src/app/assessment-results
rm -rf src/app/results
rm -rf src/app/booking
rm -rf src/app/assessment
rm -rf src/app/dashboard
rm -rf src/app/shop

# Old provider page (replaced by provider/dashboard)
rm -f src/app/provider/page.tsx
```

- [ ] **Step 2: Run build again to confirm no broken imports**

```bash
npm run build 2>&1 | tail -40
```

Expected: clean build. If errors appear, a deleted file is still being imported somewhere — fix the import before proceeding.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: delete dead routes and pages replaced by EMR integration"
```

---

## Task 13: Final Smoke Test

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify the patient funnel**

1. Register a new patient → verify email
2. Navigate to `/patient/assessment` → complete assessment
3. On redirect to `/patient/results` → should see subscription teaser (blurred)
4. Click subscribe → Stripe checkout → complete with test card `4242 4242 4242 4242`
5. Should redirect to `/patient/results` with full results visible
6. Click "Book Appointment" → `/patient/booking`
7. Select Dr. Chen → select a date → select a time slot → confirm
8. Should redirect to `/patient/dashboard?booked=1`
9. Dashboard shows the new appointment

- [ ] **Step 3: Verify provider portal**

1. Navigate to `/provider/login` → log in as a provider
2. `/provider/dashboard` → should list today's appointments (if any)
3. Click View on an appointment → pre-consultation summary with assessment + video link

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete EMR integration and route restructure"
```

---

## Supabase Actions Required (non-code)

1. **Run migration 011** — Supabase SQL Editor (Task 1, Step 2)
2. **No new environment variables needed** — EMR adapter is a mock; all existing env vars unchanged
3. **Vercel cron** — `vercel.json` now defines two cron jobs. Verify they appear in Vercel Dashboard → Settings → Cron Jobs after deploy. Both require `CRON_SECRET` env var (already set for appointment reminders).

---

## Environment Variables (no changes needed)

All existing env vars remain valid. No new ones are required while using `MockEmrAdapter`. When switching to a real EMR, add:
- `EMR_BASE_URL`
- `EMR_CLIENT_ID`
- `EMR_CLIENT_SECRET`
