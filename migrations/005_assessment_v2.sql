-- Migration 005: Assessment v2 — add clinical scoring columns
-- Run in Supabase SQL editor after deploying the updated assessment tool.

ALTER TABLE assessment_results
  ADD COLUMN IF NOT EXISTS frequency_score    INTEGER,
  ADD COLUMN IF NOT EXISTS intensity_score    INTEGER,
  ADD COLUMN IF NOT EXISTS risk_factor_count  INTEGER,
  ADD COLUMN IF NOT EXISTS risk_tier          TEXT CHECK (risk_tier IN ('low', 'moderate', 'high')),
  ADD COLUMN IF NOT EXISTS frequency_severity TEXT CHECK (frequency_severity IN ('mild', 'moderate', 'severe')),
  ADD COLUMN IF NOT EXISTS intensity_severity TEXT CHECK (intensity_severity IN ('mild', 'moderate', 'severe'));

-- Existing records will have NULL for the new columns — gracefully handled in the API.
