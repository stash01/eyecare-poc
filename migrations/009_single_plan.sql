-- Migration 009: Single membership plan
-- Replaces the three-tier plan (basic/premium/complete) with a single 'klara_membership' plan.

-- Drop the existing check constraint
ALTER TABLE patients
  DROP CONSTRAINT IF EXISTS patients_subscription_plan_check;

-- Migrate any existing subscribers to the new plan name
UPDATE patients
  SET subscription_plan = 'klara_membership'
  WHERE subscription_plan IN ('basic', 'premium', 'complete');

-- Add new constraint (after data is clean)
ALTER TABLE patients
  ADD CONSTRAINT patients_subscription_plan_check
    CHECK (subscription_plan IN ('klara_membership'));
