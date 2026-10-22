import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';
import { parseBundleInput, BUNDLE_INCLUDE, serializeBundle, refreshBundlePages } from '@/lib/bundleAdmin';

export const runtime = 'nodejs';

export async function GET(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const [bundles, soldRows] = await Promise.all([
      prisma.bundle.findMany({ orderBy: { createdAt: 'desc' }, include: BUNDLE_INCLUDE }),
      prisma.orderItem.groupBy({ by: ['bundleId'], where: { bundleId: { not: null } }, _sum: { quantity: true } }),
    ]);
    const sold = new Map(soldRows.map((r) => [r.bundleId, r._sum.quantity || 0]));
    return NextResponse.json({ success: true, data: bundles.map((b) => serializeBundle(b, sold.get(b.id) || 0)) });
  } catch (err) {
    console.error('List bundles error:', err);
    return NextResponse.json({ success: false, error: 'Failed to load bundles' }, { status: 500 });
  }
}

export async function POST(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const d = await parseBundleInput(await request.json());
    const created = await prisma.bundle.create({
      data: {
        title: d.title,
        slug: d.slug,
        description: d.description,
        price: d.price,
        image: d.image,
        tags: d.tags,
        isActive: d.isActive,
        isFeatured: d.isFeatured,
        items: { create: d.productIds.map((productId, order) => ({ productId, order })) },
      },
      include: BUNDLE_INCLUDE,
    });
    refreshBundlePages();
    return NextResponse.json({ success: true, data: serializeBundle(created) });
  } catch (err) {
    if (err?.code === 'P2002') return NextResponse.json({ success: false, error: 'A bundle with this slug already exists. Change the slug.' }, { status: 409 });
    if (!err?.code && !err?.meta) return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    console.error('Create bundle error:', err);
    return NextResponse.json({ success: false, error: 'Failed to create bundle' }, { status: 500 });
  }
}
