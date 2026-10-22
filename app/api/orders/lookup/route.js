import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getOrderDownloads, isPaidOrder } from '@/lib/downloadAccess';

export const runtime = 'nodejs';

// Customers have no accounts, so they get their files back with order number + the email used at checkout.
// Light per-IP throttle (per server instance) so order numbers cannot be guessed in bulk.
const hits = new Map();
function tooMany(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > 10;
}

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (tooMany(ip)) {
      return NextResponse.json({ success: false, error: 'Too many attempts. Please wait a minute.' }, { status: 429 });
    }

    const { orderNumber, email } = await request.json();
    const num = String(orderNumber || '').trim().toUpperCase();
    const mail = String(email || '').trim().toLowerCase();
    if (!num || !mail) {
      return NextResponse.json({ success: false, error: 'Enter your order number and email address' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber: num },
      select: { id: true, orderNumber: true, email: true, status: true, paymentStatus: true, createdAt: true, total: true, items: { select: { title: true, bundleId: true, quantity: true } } },
    });
    // One message for "no such order" and "wrong email", so it cannot be used to check which orders exist
    if (!order || order.email.trim().toLowerCase() !== mail || !isPaidOrder(order)) {
      return NextResponse.json({ success: false, error: 'We could not find a paid order with that number and email' }, { status: 404 });
    }

    const downloads = await getOrderDownloads(order.id);
    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      total: Number(order.total),
      items: order.items.map((i) => ({ title: i.title, isBundle: !!i.bundleId, quantity: i.quantity })),
      downloads,
    });
  } catch (error) {
    console.error('Order lookup error:', error);
    return NextResponse.json({ success: false, error: 'Could not look up your order. Please try again.' }, { status: 500 });
  }
}
