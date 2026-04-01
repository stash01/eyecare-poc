-- ── Email verification & password reset tokens ────────────────────────────────
-- Run this migration in the Supabase SQL editor.

ALTER TABLE patients ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- ── Email verification tokens ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  token_hash  TEXT        NOT NULL UNIQUE,   -- SHA-256 of the raw token sent in the email link
  expires_at  TIMESTAMPTZ NOT NULL,          -- 24 hours from creation
  used_at     TIMESTAMPTZ,                   -- set when the token is consumed
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS evt_token_hash_idx   ON email_verification_tokens(token_hash);
CREATE INDEX IF NOT EXISTS evt_patient_id_idx   ON email_verification_tokens(patient_id);

ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_evts" ON email_verification_tokens FOR ALL USING (FALSE);

-- ── Password reset tokens ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  token_hash  TEXT        NOT NULL UNIQUE,   -- SHA-256 of the raw token sent in the email link
  expires_at  TIMESTAMPTZ NOT NULL,          -- 1 hour from creation
  used_at     TIMESTAMPTZ,                   -- set when the token is consumed
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS prt_token_hash_idx   ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS prt_patient_id_idx   ON password_reset_tokens(patient_id);

ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_prts" ON password_reset_tokens FOR ALL USING (FALSE);
