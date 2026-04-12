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
