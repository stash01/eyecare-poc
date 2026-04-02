-- ─── Migration 007: Admin / God Mode Account ─────────────────────────────────

-- Add admin flag to patients
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Insert admin dev account
-- Password is intentionally empty — set it via POST /api/admin/setup after running this migration.
INSERT INTO patients (
  first_name, last_name, email, password_hash,
  email_verified, is_admin,
  consent_phipa, consent_phipa_timestamp,
  consent_terms, consent_terms_timestamp,
  date_of_birth
) VALUES (
  'Admin', 'Dev', 'admin@klaramd.com', '',
  true, true,
  true, NOW(), true, NOW(),
  '1990-01-01'
) ON CONFLICT (email) DO UPDATE SET is_admin = true;
