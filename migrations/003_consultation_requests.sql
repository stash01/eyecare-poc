-- KlaraMD Consultation Requests (Phase 2 — reversed scheduling model)
-- Patients declare availability windows; providers book from within those windows.
-- Run after 002_scheduling.sql.

-- ─── Consultation requests ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS consultation_requests (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id           UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  assessment_result_id UUID REFERENCES assessment_results(id),
  status               TEXT NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'scheduled', 'cancelled')),
  patient_notes        TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS consultation_requests_patient_id_idx ON consultation_requests(patient_id);
CREATE INDEX IF NOT EXISTS consultation_requests_status_idx     ON consultation_requests(status);
CREATE INDEX IF NOT EXISTS consultation_requests_created_at_idx ON consultation_requests(created_at DESC);

-- ─── Patient availability windows ─────────────────────────────────────────────
-- Each row is one block of time the patient has declared they are free.

CREATE TABLE IF NOT EXISTS patient_availability (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_request_id UUID NOT NULL REFERENCES consultation_requests(id) ON DELETE CASCADE,
  available_from          TIMESTAMPTZ NOT NULL,
  available_until         TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS patient_availability_request_id_idx ON patient_availability(consultation_request_id);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE consultation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_availability  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deny_all_consultation_requests" ON consultation_requests FOR ALL USING (FALSE);
CREATE POLICY "deny_all_patient_availability"  ON patient_availability  FOR ALL USING (FALSE);

-- ─── Link appointments back to consultation requests ──────────────────────────

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS consultation_request_id UUID
  REFERENCES consultation_requests(id);
