-- Migration 006: Provider Auth
-- Adds email/password_hash to providers table and creates provider_sessions table.
-- Run in Supabase SQL editor.

ALTER TABLE providers
  ADD COLUMN IF NOT EXISTS email         TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Seed provider emails (passwords must be set via the /api/provider/auth/setup endpoint below)
UPDATE providers SET email = 'dr.chen@klaramd.com'   WHERE cpso_number = '12345';
UPDATE providers SET email = 'dr.wilson@klaramd.com' WHERE cpso_number = '67891';

-- Provider sessions table (parallel to auth_sessions for patients)
CREATE TABLE IF NOT EXISTS provider_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID        NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  token_hash  TEXT        NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS provider_sessions_provider_id_idx ON provider_sessions(provider_id);

ALTER TABLE provider_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_provider_sessions" ON provider_sessions FOR ALL USING (false);

-- IMPORTANT: After running this migration, set provider passwords using the setup endpoint:
--   POST /api/provider/auth/setup  { "cpso": "12345", "password": "..." }
-- This endpoint should be disabled or removed after initial setup.
