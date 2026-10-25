import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { requireAdmin } from '@/lib/adminAuth';
import { brandFromRequest, stripeSettings } from '@/lib/stripe';
import { getOrderDownloads } from '@/lib/downloadAccess';
import { priceItems, evaluateCoupon, claimCoupon, releaseCoupon, recordRedemption } from '@/lib/coupons';

// GET all orders (for admin)
export async function GET(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.order.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      stripeMode: stripeSettings(brandFromRequest(request)).mode, // 'test' | 'live' | null
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST create new order
export async function POST(request) {
  // The old "demo" checkout created a PAID order for anyone, with no payment. Real orders now go through
  // /api/stripe/create-checkout (Stripe for paid carts, instant completion for free carts). This endpoint stays only for local
  // development and tests, and only when ALLOW_DEMO_CHECKOUT=true is set explicitly. Never set it on the live site.
  if (process.env.ALLOW_DEMO_CHECKOUT !== 'true') {
    return NextResponse.json({ success: false, error: 'Please use the secure checkout.' }, { status: 410 });
  }
  try {
    const body = await request.json();
    const { email, customerName, couponCode } = body;
    let items = body.items;

    if (!email || !customerName || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Email, customer name, and items are required' },
        { status: 400 }
      );
    }

    // Prices come from the database (sale price if set), never from the browser
    let priced;
    try {
      priced = await priceItems(items);
    } catch (e) {
      return NextResponse.json({ success: false, error: e.message }, { status: 400 });
    }
    items = priced.lines;
    const amount = priced.subtotal;

    // Generate order number
    const orderNumber = `CCP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Find or create guest user
    let user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: uuidv4(),
          name: customerName,
          email,
          password: 'guest-no-password',
          role: 'CUSTOMER',
          emailVerified: false
        }
      });
    }

    // Optional coupon: validated again here, then one use is claimed atomically
    let discount = 0;
    let appliedCoupon = null;
    if (couponCode && String(couponCode).trim()) {
      const r = await evaluateCoupon(couponCode, amount, email);
      if (!r.ok) return NextResponse.json({ success: false, error: r.error }, { status: 400 });
      if (!(await claimCoupon(r.coupon.id))) {
        return NextResponse.json({ success: false, error: 'This coupon has reached its usage limit' }, { status: 400 });
      }
      discount = r.discount;
      appliedCoupon = r.coupon;
    }
    const total = Math.round((amount - discount) * 100) / 100; // No tax for digital products

    // Create order with items
    let order;
    try {
    order = await prisma.order.create({
      data: {
        id: uuidv4(),
        orderNumber,
        userId: user.id,
        amount,
        total,
        status: amount === 0 ? 'COMPLETED' : 'COMPLETED', // Mock checkout always completes
        paymentStatus: amount === 0 ? 'PAID' : 'PAID', // Mock payment
        paymentMethod: total === 0 ? 'FREE' : 'MOCK_PAYMENT',
        ...(appliedCoupon ? { metadata: { coupon: { code: appliedCoupon.code, discount, subtotal: amount } } } : {}),
        email,
        customerName,
        items: {
          create: items.map(item => ({
            id: uuidv4(),
            productId: item.productId,
            bundleId: item.bundleId,
            itemType: item.itemType,
            title: item.title,
            price: item.price,
            quantity: item.quantity
          }))
        }
      },
      include: {
        items: true
      }
    });
    } catch (e) {
      if (appliedCoupon) await releaseCoupon(appliedCoupon.id).catch(() => {});
      throw e;
    }

    if (appliedCoupon) {
      await recordRedemption({ couponId: appliedCoupon.id, orderId: order.id, orderNumber, email, discount })
        .catch(err => console.error('Failed to record coupon redemption:', err));
    }

    // Members of every purchased bundle (so their files can be delivered and their download counts kept)
    const bundleLines = items.filter(i => i.bundleId);
    let bundleMembers = [];
    if (bundleLines.length > 0) {
      try {
        const rows = await prisma.bundleItem.findMany({
          where: { bundleId: { in: bundleLines.map(i => i.bundleId) } },
          orderBy: { order: 'asc' },
          select: { bundleId: true, product: { select: { id: true, title: true, pdfPath: true, isActive: true } } }
        });
        bundleMembers = rows.filter(r => r.product);
      } catch (err) {
        console.error('Failed to load bundle contents:', err);
      }
    }

    // Increment download counts for products (a bundle counts once for each product inside it)
    for (const item of items) {
      if (item.productId) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { downloads: { increment: item.quantity } }
        }).catch(() => {}); // Ignore if product not found
      }
    }
    for (const line of bundleLines) {
      for (const m of bundleMembers.filter(r => r.bundleId === line.bundleId)) {
        await prisma.product.update({
          where: { id: m.product.id },
          data: { downloads: { increment: line.quantity } }
        }).catch(() => {});
      }
    }

    // Send confirmation email
    await sendOrderConfirmationEmail({
      email,
      orderNumber,
      items,
      total
    }).catch(err => console.error('Failed to send order email:', err));

    // Files the customer can download right now, each with its proof-of-purchase token
    let downloads = [];
    try {
      downloads = await getOrderDownloads(order.id);
    } catch (err) {
      console.error('Failed to prepare order downloads:', err);
    }

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      order,
      downloads
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
