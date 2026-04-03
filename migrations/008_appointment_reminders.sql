-- Migration 008: Appointment Reminder Tracking
-- Adds reminder_sent_at to appointments so the cron job can track which reminders have been sent.
-- Run in Supabase SQL editor.

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

-- Partial index for efficient cron queries: only unreminded scheduled appointments
CREATE INDEX IF NOT EXISTS appointments_reminder_idx
  ON appointments(scheduled_at)
  WHERE reminder_sent_at IS NULL AND status = 'scheduled';
