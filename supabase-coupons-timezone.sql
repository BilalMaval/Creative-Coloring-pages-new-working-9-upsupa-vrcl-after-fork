-- ============================================================
-- RUN THIS ONCE in Supabase Dashboard -> SQL Editor  (run it BEFORE redeploying)
-- Adds two small columns to the coupons table so the admin form remembers which time zone
-- a coupon's start and end were entered in. The start/end moments themselves stay in UTC.
-- Existing coupons and orders are not changed. Safe to run twice.
-- ============================================================

ALTER TABLE coupons ADD COLUMN IF NOT EXISTS start_timezone text;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS end_timezone   text;
