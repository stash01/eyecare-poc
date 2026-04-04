-- Migration 010: Stripe integration
-- Adds Stripe customer/subscription tracking to patients, and creates an orders table.

-- ── patients additions ─────────────────────────────────────────────────────────
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS stripe_customer_id     TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS subscription_status    TEXT
    CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'trialing'))
    DEFAULT NULL;

CREATE INDEX IF NOT EXISTS patients_stripe_customer_idx ON patients(stripe_customer_id);

-- ── orders table ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id                 UUID REFERENCES patients(id) ON DELETE SET NULL,
  stripe_checkout_session_id TEXT NOT NULL UNIQUE,
  stripe_payment_intent_id   TEXT,
  amount_total               INTEGER NOT NULL,   -- in cents
  currency                   TEXT NOT NULL DEFAULT 'cad',
  status                     TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  customer_email             TEXT,
  shipping_name              TEXT,
  shipping_address           JSONB,
  line_items                 JSONB,              -- snapshot of cart at time of purchase
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS orders_patient_id_idx ON orders(patient_id);
CREATE INDEX IF NOT EXISTS orders_session_id_idx ON orders(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_orders" ON orders FOR ALL USING (FALSE);
