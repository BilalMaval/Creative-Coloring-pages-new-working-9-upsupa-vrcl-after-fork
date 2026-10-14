-- ============================================================
-- RUN THIS ONCE in Supabase Dashboard -> SQL Editor
-- Adds two NEW tables for the coupon feature. It does not touch any existing table or data.
-- ============================================================

CREATE TABLE IF NOT EXISTS coupons (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code                text NOT NULL,
  description         text,
  discount_type       text NOT NULL CHECK (discount_type IN ('PERCENT', 'FIXED')),
  discount_value      numeric(10,2) NOT NULL CHECK (discount_value > 0),
  min_order_amount    numeric(10,2) NOT NULL DEFAULT 0,
  max_discount_amount numeric(10,2),
  starts_at           timestamptz,
  expires_at          timestamptz,
  usage_limit         integer,
  per_customer_limit  integer,
  used_count          integer NOT NULL DEFAULT 0,
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Codes are case-insensitive and unique
CREATE UNIQUE INDEX IF NOT EXISTS coupons_code_unique ON coupons (upper(code));

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id       uuid NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  order_id        text,
  order_number    text,
  email           text NOT NULL,
  discount_amount numeric(10,2) NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coupon_redemptions_coupon_idx ON coupon_redemptions (coupon_id);
CREATE INDEX IF NOT EXISTS coupon_redemptions_email_idx  ON coupon_redemptions (coupon_id, lower(email));

-- Lock both tables: only the server (service role / database connection) can read or write them.
-- The public anon key gets no access, so visitors can never list coupon codes.
ALTER TABLE coupons            ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;
