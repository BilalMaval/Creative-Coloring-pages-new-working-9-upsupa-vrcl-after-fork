import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';
import { COUPON_COLUMNS, isMissingTable, parseCouponInput } from '@/lib/coupons';

export const runtime = 'nodejs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Edit a coupon, or toggle it on/off with { toggleOnly: true, isActive }
export async function PUT(request, { params }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = params;
  if (!UUID.test(id)) return NextResponse.json({ success: false, error: 'Invalid coupon' }, { status: 400 });
  try {
    const body = await request.json();

    if (body.toggleOnly) {
      const rows = await prisma.$queryRawUnsafe(
        `UPDATE coupons SET is_active = $2, updated_at = now() WHERE id = $1::uuid RETURNING ${COUPON_COLUMNS}`,
        id, body.isActive === true
      );
      if (!rows[0]) return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 });
      return NextResponse.json({ success: true, data: rows[0] });
    }

    const c = parseCouponInput(body);
    const rows = await prisma.$queryRawUnsafe(
      `UPDATE coupons SET code = $2, description = $3, discount_type = $4, discount_value = $5::numeric,
         min_order_amount = $6::numeric, max_discount_amount = $7::numeric, starts_at = $8::timestamptz,
         expires_at = $9::timestamptz, usage_limit = $10::int, per_customer_limit = $11::int, is_active = $12,
         updated_at = now()
       WHERE id = $1::uuid RETURNING ${COUPON_COLUMNS}`,
      id, c.code, c.description, c.type, c.value, c.minOrder, c.maxDiscount, c.startsAt, c.expiresAt, c.usageLimit, c.perCustomer, c.isActive
    );
    if (!rows[0]) return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: rows[0] });
  } catch (err) {
    if (isMissingTable(err)) return NextResponse.json({ success: false, error: 'Coupon tables are not set up yet' }, { status: 503 });
    if (/unique|duplicate/i.test(String(err?.message))) return NextResponse.json({ success: false, error: 'A coupon with this code already exists' }, { status: 409 });
    if (!err?.code && !err?.meta) return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    console.error('Update coupon error:', err);
    return NextResponse.json({ success: false, error: 'Failed to update coupon' }, { status: 500 });
  }
}

// Only coupons that were never used can be deleted; used ones should be disabled to keep order history intact.
export async function DELETE(request, { params }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = params;
  if (!UUID.test(id)) return NextResponse.json({ success: false, error: 'Invalid coupon' }, { status: 400 });
  try {
    const used = await prisma.$queryRawUnsafe('SELECT count(*)::int AS n FROM coupon_redemptions WHERE coupon_id = $1::uuid', id);
    if ((used[0]?.n || 0) > 0) {
      return NextResponse.json({ success: false, error: 'This coupon has been used on orders. Disable it instead of deleting it.' }, { status: 409 });
    }
    await prisma.$executeRawUnsafe('DELETE FROM coupons WHERE id = $1::uuid', id);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (isMissingTable(err)) return NextResponse.json({ success: false, error: 'Coupon tables are not set up yet' }, { status: 503 });
    console.error('Delete coupon error:', err);
    return NextResponse.json({ success: false, error: 'Failed to delete coupon' }, { status: 500 });
  }
}
