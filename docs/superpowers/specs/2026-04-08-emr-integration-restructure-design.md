# KlaraMD — EMR Integration & Codebase Restructure
**Design Spec · 2026-04-08**

---

## Overview

Restructure the KlaraMD Next.js codebase and replace native Supabase scheduling with an EMR integration. The EMR becomes the source of truth for provider availability, appointments, OHIP billing, and chart notes. Klara owns the patient experience, subscription gating, video rooms, emails, and assessment data.

**Approach:** Big-bang rewrite (POC — downtime acceptable).

---

## Responsibility Split

| Concern | Owner |
|---|---|
| Provider availability | EMR |
| Appointment slots (source of truth) | EMR |
| Booking UI / patient experience | Klara |
| Confirmation emails + reminders | Klara |
| Video room URL | Klara (Daily.co) |
| Assessment results | Klara (pushed to EMR as note) |
| OHIP billing | EMR |
| Chart notes | EMR |
| Subscription billing | Klara (Stripe) |
| Shop / private pay | Klara (Stripe) |

---

## 1. Route Structure

### Patient-facing
```
/                            Marketing / landing
/login                       Patient auth
/register
/verify-email
/forgot-password
/reset-password
/subscribe                   Stripe subscription gate (+ return page)
/privacy  /terms  /blog

/patient/assessment          Clinical intake (free — no subscription required)
/patient/results             Assessment results + treatment recs (subscription required)
/patient/booking             EMR-backed slot picker (subscription required)
/patient/dashboard           Upcoming appointments, symptom tracker (subscription required)
/patient/shop                Product shop
/patient/shop/[productId]
/patient/shop/cart
/patient/shop/checkout
/patient/shop/order-confirmation
```

### Provider-facing (read-only)
```
/provider/login
/provider/dashboard          Today's appointments list
/provider/appointments/[id]  Pre-consultation view: assessment summary + video link
```

### Admin
```
/admin                       Unchanged
```

### API
```
/api/auth/**                 Unchanged
/api/stripe/**               Unchanged
/api/subscriptions           Unchanged

/api/emr/slots               GET — fetch available slots from EMR adapter
/api/emr/book                POST — full booking orchestration
/api/emr/notes/retry         POST (cron) — retry failed note pushes

/api/appointments/[id]       GET — Klara-side appointment (video URL, status)
/api/cron/appointment-reminders  Unchanged
```

### Deleted routes
```
/consultation
/request-consultation
/recommendations             (merged into /patient/results)
/confirmation                (replaced by /patient/dashboard redirect)
/assessment-results          (renamed to /patient/results)
/booking                     (moved to /patient/booking)
/api/availability
/api/provider/schedule
/api/provider/availability
/api/provider/requests
/api/consultation-requests
/api/admin/requests
```

---

## 2. Supabase Schema Changes

Single migration: `011_emr_integration.sql`

### Tables dropped
- `providers`
- `provider_availability`
- `consultation_requests`

### `appointments` — modified
```sql
-- Remove columns:
--   provider_uuid, ohip_eligible, billing_status, provider_id (legacy int)

-- Add columns:
emr_appointment_id   TEXT UNIQUE,
emr_note_id          TEXT,
note_push_status     TEXT NOT NULL DEFAULT 'pending'
  CHECK (note_push_status IN ('pending', 'pushed', 'failed'))
```

### `patients` — modified
```sql
-- Add column:
emr_patient_id   TEXT UNIQUE
```

### New table: `emr_note_retry_queue`
```sql
CREATE TABLE emr_note_retry_queue (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id       UUID NOT NULL REFERENCES appointments(id),
  assessment_result_id UUID NOT NULL REFERENCES assessment_results(id),
  attempts             INTEGER NOT NULL DEFAULT 0,
  last_attempted_at    TIMESTAMPTZ,
  last_error           TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 3. EMR Adapter

**File:** `src/lib/server/emr.ts` (replaces `jane-client.ts`)

```ts
export interface EmrAdapter {
  getProviders(): Promise<EmrProvider[]>

  getSlots(params: {
    providerId: string
    days: number
  }): Promise<EmrSlot[]>

  bookAppointment(params: {
    emrPatientId: string
    providerId: string
    startAt: string
    durationMinutes: number
  }): Promise<{ emrAppointmentId: string }>

  ensurePatient(params: {
    firstName: string
    lastName: string
    email: string
    dateOfBirth: string
    healthCardNumber?: string
  }): Promise<string>  // returns emr_patient_id

  pushNote(params: {
    emrPatientId: string
    emrAppointmentId: string
    noteText: string
    date: string
  }): Promise<{ emrNoteId: string }>
}

export class SlotTakenError extends Error {}

// Swap this line to connect a real EMR
export const emr: EmrAdapter = new MockEmrAdapter()
```

`MockEmrAdapter` returns realistic fake data so the full booking flow works end-to-end without any EMR credentials.

---

## 4. Booking Flow (POST /api/emr/book)

```
1. Validate patient session + active subscription
2. emr.ensurePatient() → store emr_patient_id on patients row if new
3. emr.bookAppointment()
   └─ SlotTakenError → 409, client refreshes slots and shows graceful error
4. Create Daily.co video room
5. INSERT into appointments:
     emr_appointment_id, video_room_url, patient_id, assessment_result_id,
     note_push_status = 'pending'
6. Send confirmation email with video link (Resend / existing email.ts)
7. Async (non-blocking): emr.pushNote()
   └─ success → update appointments SET emr_note_id, note_push_status = 'pushed'
   └─ failure → INSERT into emr_note_retry_queue
8. Return { appointmentId } → client redirects to /patient/dashboard
```

**Retry cron** (`/api/emr/notes/retry` — runs every 30 min via Vercel cron):
- Picks up rows in `emr_note_retry_queue` where `attempts < 5`
- On success: updates `appointments.note_push_status = 'pushed'`, deletes queue row
- After 5 failures: marks `note_push_status = 'failed'` for manual review

---

## 5. Subscription Gating

Middleware extends existing session validation:

| Route | Requires login | Requires subscription |
|---|---|---|
| `/patient/assessment` | Yes | No |
| `/patient/results` | Yes | Soft gate (teaser + subscribe prompt) |
| `/patient/booking` | Yes | Yes (hard redirect) |
| `/patient/dashboard` | Yes | Yes (hard redirect) |
| `/patient/shop/**` | Yes | Yes |
| `/provider/**` | Yes (provider session) | N/A |
| `/admin/**` | Yes (admin session) | N/A |

**Soft gate on `/patient/results`:** Patient sees a blurred/teased preview of their results with a subscribe prompt. After subscribing, Stripe webhook sets `subscription_status = 'active'` and the return URL is `/patient/results`.

---

## 6. Provider Portal

Read-only. No schedule management.

**`/provider/dashboard`**
- Queries `appointments` WHERE `provider_id` (from provider session) AND `scheduled_at` on today
- Shows: patient name, time, assessment risk tier, "View" link

**`/provider/appointments/[id]`**
- Assessment results summary: severity score, risk tier, symptom scores, treatment history
- Video room join button (Daily.co URL from `appointments.video_room_url`)
- Read-only — no editing

**Removed from provider portal:**
- Schedule/availability management
- Consultation request handling
- Provider setup flow

---

## 7. What Stays Unchanged

- Patient auth (register, login, email verification, password reset, sessions)
- Assessment flow and scoring logic (`assessment-questions.ts`, `assessment-utils.ts`)
- Daily.co video room creation (`daily-co.ts`)
- Email sending (`email.ts`, Resend, iCal attachments)
- Appointment reminders cron
- Stripe shop + subscription checkout + webhook handler
- Admin panel
- Audit logging (`audit.ts`)
- Encryption (`crypto.ts`)
- PHIPA compliance posture

---

## 8. Files to Delete

Migration SQL files are kept as historical records — the live tables are dropped via `011_emr_integration.sql`.

```
src/lib/server/jane-client.ts
src/app/api/availability/
src/app/api/consultation-requests/
src/app/api/provider/availability/
src/app/api/provider/requests/
src/app/api/provider/schedule/
src/app/api/admin/requests/
src/app/consultation/
src/app/request-consultation/
src/app/recommendations/
src/app/confirmation/
src/app/assessment-results/
src/app/results/
```

---

## Open Questions

- **Which EMR?** OscarPro and Accuro are the leading candidates for Ontario ophthalmology. Decision deferred until clinic partner is confirmed. `MockEmrAdapter` unblocks all development.
- **Provider list in Klara:** With `providers` table dropped, the booking UI fetches providers via `GET /api/emr/slots` (adapter exposes `getProviders()`). `MockEmrAdapter` returns the 2 existing seeded providers (Dr. Chen, Dr. Wilson).
- **Video room timing:** Currently created at booking. If EMR eventually provides a video URL, Daily.co becomes optional.
- **OHIP vs private pay split:** Subscription grants platform access. OHIP patients are billed through EMR. Non-OHIP patients — per-visit Stripe checkout at booking time is deferred to a later phase.
