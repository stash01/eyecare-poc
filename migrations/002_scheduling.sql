-- KlaraMD Scheduling Schema (Phase 2)
-- Replaces Jane App integration with native Supabase scheduling.
-- Run after 001_initial_schema.sql.

-- ─── Providers ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS providers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  credentials  TEXT NOT NULL,
  specialty    TEXT NOT NULL,
  subspecialty TEXT,
  expertise    TEXT[] NOT NULL DEFAULT '{}',
  cpso_number  TEXT,
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Provider weekly availability ─────────────────────────────────────────────
-- Defines recurring weekly windows. Slots are generated at runtime from these rows.

CREATE TABLE IF NOT EXISTS provider_availability (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id  UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  day_of_week  INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun, 1=Mon
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  slot_minutes INTEGER NOT NULL DEFAULT 30
);

CREATE INDEX IF NOT EXISTS provider_availability_provider_idx
  ON provider_availability(provider_id, day_of_week);

-- ─── Update appointments ───────────────────────────────────────────────────────
-- Add UUID reference to new providers table. The legacy integer provider_id
-- is left in place for backward compat but is no longer required for new bookings.

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS provider_uuid UUID REFERENCES providers(id);
ALTER TABLE appointments ALTER COLUMN provider_id DROP NOT NULL;

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE providers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deny_all_providers"             ON providers             FOR ALL USING (FALSE);
CREATE POLICY "deny_all_provider_availability" ON provider_availability FOR ALL USING (FALSE);

-- ─── Seed providers ───────────────────────────────────────────────────────────

INSERT INTO providers (id, name, credentials, specialty, subspecialty, expertise, cpso_number)
VALUES
  (
    'a1b2c3d4-0001-0001-0001-000000000001',
    'Dr. Sarah Chen', 'MD, FRCSC', 'Ophthalmologist',
    'Cornea & External Disease',
    ARRAY['Dry Eye Disease', 'Ocular Surface Disorders', 'Corneal Conditions'],
    '12345'
  ),
  (
    'a1b2c3d4-0002-0002-0002-000000000002',
    'Dr. James Wilson', 'MD, FRCSC', 'Ophthalmologist',
    'Oculoplastics & Tear Film',
    ARRAY['Meibomian Gland Dysfunction', 'Blepharitis', 'Punctal Procedures'],
    '67891'
  )
ON CONFLICT (id) DO NOTHING;

-- ─── Seed weekly availability: Mon–Fri, 9am–12pm and 1pm–5pm ─────────────────

INSERT INTO provider_availability (provider_id, day_of_week, start_time, end_time, slot_minutes)
SELECT p.id, d.day, '09:00'::TIME, '12:00'::TIME, 30
FROM providers p
CROSS JOIN (VALUES (1),(2),(3),(4),(5)) AS d(day)
WHERE p.active = TRUE;

INSERT INTO provider_availability (provider_id, day_of_week, start_time, end_time, slot_minutes)
SELECT p.id, d.day, '13:00'::TIME, '17:00'::TIME, 30
FROM providers p
CROSS JOIN (VALUES (1),(2),(3),(4),(5)) AS d(day)
WHERE p.active = TRUE;
