import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';
import { parseBundleInput, BUNDLE_INCLUDE, serializeBundle, refreshBundlePages } from '@/lib/bundleAdmin';

export const runtime = 'nodejs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Edit a bundle, or flip a switch with { toggle: 'isActive' | 'isFeatured', value: true|false }
export async function PUT(request, { params }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = params;
  if (!UUID.test(id)) return NextResponse.json({ success: false, error: 'Invalid bundle' }, { status: 400 });
  try {
    const body = await request.json();

    if (body.toggle) {
      if (!['isActive', 'isFeatured'].includes(body.toggle)) return NextResponse.json({ success: false, error: 'Invalid change' }, { status: 400 });
      const updated = await prisma.bundle.update({ where: { id }, data: { [body.toggle]: body.value === true }, include: BUNDLE_INCLUDE });
      refreshBundlePages();
      return NextResponse.json({ success: true, data: serializeBundle(updated) });
    }

    const d = await parseBundleInput(body);
    const updated = await prisma.$transaction(async (tx) => {
      await tx.bundleItem.deleteMany({ where: { bundleId: id } });
      return tx.bundle.update({
        where: { id },
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
    });
    refreshBundlePages();
    return NextResponse.json({ success: true, data: serializeBundle(updated) });
  } catch (err) {
    if (err?.code === 'P2025') return NextResponse.json({ success: false, error: 'Bundle not found' }, { status: 404 });
    if (err?.code === 'P2002') return NextResponse.json({ success: false, error: 'A bundle with this slug already exists. Change the slug.' }, { status: 409 });
    if (!err?.code && !err?.meta) return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    console.error('Update bundle error:', err);
    return NextResponse.json({ success: false, error: 'Failed to update bundle' }, { status: 500 });
  }
}

// A bundle that customers already bought is kept (disable it instead) so order history stays complete.
export async function DELETE(request, { params }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = params;
  if (!UUID.test(id)) return NextResponse.json({ success: false, error: 'Invalid bundle' }, { status: 400 });
  try {
    const sold = await prisma.orderItem.count({ where: { bundleId: id } });
    if (sold > 0) {
      return NextResponse.json({ success: false, error: 'This bundle has been purchased. Disable it instead of deleting it.' }, { status: 409 });
    }
    await prisma.bundle.delete({ where: { id } });
    refreshBundlePages();
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err?.code === 'P2025') return NextResponse.json({ success: false, error: 'Bundle not found' }, { status: 404 });
    console.error('Delete bundle error:', err);
    return NextResponse.json({ success: false, error: 'Failed to delete bundle' }, { status: 500 });
  }
}
