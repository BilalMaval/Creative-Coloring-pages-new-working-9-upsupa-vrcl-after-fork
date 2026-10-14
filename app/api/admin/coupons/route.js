import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';
import { COUPON_COLUMNS, isMissingTable, parseCouponInput } from '@/lib/coupons';

export const runtime = 'nodejs';

const NOT_SETUP = 'Coupon tables are not set up yet. Run supabase-coupons-migration.sql in the Supabase SQL Editor first.';

export async function GET(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT ${COUPON_COLUMNS},
        COALESCE((SELECT sum(discount_amount)::float8 FROM coupon_redemptions r WHERE r.coupon_id = coupons.id), 0) AS total_discounted
       FROM coupons ORDER BY created_at DESC`
    );
    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    if (isMissingTable(err)) return NextResponse.json({ success: false, setupRequired: true, error: NOT_SETUP }, { status: 503 });
    console.error('List coupons error:', err);
    return NextResponse.json({ success: false, error: 'Failed to load coupons' }, { status: 500 });
  }
}

export async function POST(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const c = parseCouponInput(await request.json());
    const rows = await prisma.$queryRawUnsafe(
      `INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, starts_at, expires_at, usage_limit, per_customer_limit, is_active)
       VALUES ($1, $2, $3, $4::numeric, $5::numeric, $6::numeric, $7::timestamptz, $8::timestamptz, $9::int, $10::int, $11)
       RETURNING ${COUPON_COLUMNS}`,
      c.code, c.description, c.type, c.value, c.minOrder, c.maxDiscount, c.startsAt, c.expiresAt, c.usageLimit, c.perCustomer, c.isActive
    );
    return NextResponse.json({ success: true, data: rows[0] });
  } catch (err) {
    if (isMissingTable(err)) return NextResponse.json({ success: false, setupRequired: true, error: NOT_SETUP }, { status: 503 });
    if (/unique|duplicate/i.test(String(err?.message))) return NextResponse.json({ success: false, error: 'A coupon with this code already exists' }, { status: 409 });
    if (!err?.code && !err?.meta) return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    console.error('Create coupon error:', err);
    return NextResponse.json({ success: false, error: 'Failed to create coupon' }, { status: 500 });
  }
}
