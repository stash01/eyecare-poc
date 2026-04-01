-- KlaraMD Initial Schema
-- Run against a Supabase (Canada Central) PostgreSQL instance.
-- After running: enable RLS on each table and apply the policies below.

-- Patients (Health Information Custodian records)
CREATE TABLE IF NOT EXISTS patients (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jane_patient_id         TEXT,                -- set after Jane API sync (Phase 2)
  first_name              TEXT NOT NULL,
  last_name               TEXT NOT NULL,
  email                   TEXT NOT NULL UNIQUE,
  phone                   TEXT,
  date_of_birth           DATE NOT NULL,
  health_card_number      TEXT,                -- AES-256-GCM encrypted at application layer
  province                TEXT NOT NULL DEFAULT 'ON',
  password_hash           TEXT NOT NULL,
  subscription_plan       TEXT CHECK (subscription_plan IN ('basic','premium','complete')),
  consent_phipa           BOOLEAN NOT NULL DEFAULT FALSE,
  consent_phipa_timestamp TIMESTAMPTZ,
  consent_terms           BOOLEAN NOT NULL DEFAULT FALSE,
  consent_terms_timestamp TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auth sessions (httpOnly cookie sessions — never store JWTs in localStorage)
CREATE TABLE IF NOT EXISTS auth_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,   -- SHA-256(session_token) — never store raw token
  expires_at  TIMESTAMPTZ NOT NULL,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS auth_sessions_token_hash_idx ON auth_sessions(token_hash);
CREATE INDEX IF NOT EXISTS auth_sessions_patient_id_idx ON auth_sessions(patient_id);
CREATE INDEX IF NOT EXISTS auth_sessions_expires_at_idx ON auth_sessions(expires_at);

-- Assessment results (DEQ-5 / DEWS3 clinical scores)
CREATE TABLE IF NOT EXISTS assessment_results (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id          UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  jane_chart_note_id  TEXT,             -- set after Jane chart note push (Phase 2)
  total_score         INTEGER NOT NULL,
  deq5_score          INTEGER NOT NULL,
  deq5_positive       BOOLEAN NOT NULL,
  severity            TEXT NOT NULL CHECK (severity IN ('mild','moderate','severe')),
  has_autoimmune      BOOLEAN NOT NULL DEFAULT FALSE,
  has_diabetes        BOOLEAN NOT NULL DEFAULT FALSE,
  has_mgd             BOOLEAN NOT NULL DEFAULT FALSE,
  tried_treatments    BOOLEAN NOT NULL DEFAULT FALSE,
  screening_red_flags TEXT[] NOT NULL DEFAULT '{}',
  raw_answers         JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS assessment_results_patient_id_idx ON assessment_results(patient_id);
CREATE INDEX IF NOT EXISTS assessment_results_created_at_idx ON assessment_results(created_at DESC);

-- Appointments (synced with Jane App in Phase 2)
CREATE TABLE IF NOT EXISTS appointments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id            UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  jane_appointment_id   TEXT,
  provider_id           INTEGER NOT NULL,   -- maps to PROVIDERS array in constants.ts
  scheduled_at          TIMESTAMPTZ NOT NULL,
  duration_minutes      INTEGER NOT NULL DEFAULT 30,
  appointment_type      TEXT NOT NULL CHECK (appointment_type IN ('new_patient','follow_up')),
  status                TEXT NOT NULL DEFAULT 'scheduled'
                          CHECK (status IN ('scheduled','in_progress','completed','cancelled','no_show')),
  ohip_eligible         BOOLEAN NOT NULL DEFAULT FALSE,
  billing_status        TEXT NOT NULL DEFAULT 'pending'
                          CHECK (billing_status IN ('pending','submitted','paid','rejected')),
  video_room_url        TEXT,
  jane_invoice_id       TEXT,
  assessment_result_id  UUID REFERENCES assessment_results(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS appointments_patient_id_idx ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS appointments_scheduled_at_idx ON appointments(scheduled_at DESC);

-- Audit log (append-only — PHIPA s.13 requires 10-year retention)
-- IMPORTANT: revoke UPDATE and DELETE privileges on this table for the application role.
CREATE TABLE IF NOT EXISTS audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type    TEXT NOT NULL CHECK (actor_type IN ('patient','provider','system')),
  actor_id      UUID,
  action        TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id   UUID,
  ip_address    TEXT,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_log_actor_id_idx    ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS audit_log_resource_id_idx ON audit_log(resource_id);
CREATE INDEX IF NOT EXISTS audit_log_created_at_idx  ON audit_log(created_at DESC);

-- ─── Row-Level Security ────────────────────────────────────────────────────────
-- Enable RLS on all tables. The service role bypasses RLS (used server-side).
-- These policies protect against accidental direct client access.

ALTER TABLE patients          ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log         ENABLE ROW LEVEL SECURITY;

-- Service role (used by the Next.js server) bypasses RLS — no policies needed for it.
-- All policies below restrict the anon/authenticated Supabase roles (should never be used directly).

-- Deny all direct client access to these tables
CREATE POLICY "deny_all_patients"           ON patients           FOR ALL USING (FALSE);
CREATE POLICY "deny_all_auth_sessions"      ON auth_sessions      FOR ALL USING (FALSE);
CREATE POLICY "deny_all_assessment_results" ON assessment_results FOR ALL USING (FALSE);
CREATE POLICY "deny_all_appointments"       ON appointments       FOR ALL USING (FALSE);
CREATE POLICY "deny_all_audit_log"          ON audit_log          FOR ALL USING (FALSE);

-- ─── Cleanup function ─────────────────────────────────────────────────────────
-- Call periodically to remove expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
  DELETE FROM auth_sessions WHERE expires_at < NOW();
$$ LANGUAGE sql;
