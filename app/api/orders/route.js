import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { sendOrderConfirmationEmail } from '@/lib/email';

// GET all orders (for admin)
export async function GET(request) {
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
  try {
    const body = await request.json();
    const { email, customerName, items } = body;

    if (!email || !customerName || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Email, customer name, and items are required' },
        { status: 400 }
      );
    }

    // Calculate totals
    const amount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = amount; // No tax for digital products

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

    // Create order with items
    const order = await prisma.order.create({
      data: {
        id: uuidv4(),
        orderNumber,
        userId: user.id,
        amount,
        total,
        status: amount === 0 ? 'COMPLETED' : 'COMPLETED', // Mock checkout always completes
        paymentStatus: amount === 0 ? 'PAID' : 'PAID', // Mock payment
        paymentMethod: amount === 0 ? 'FREE' : 'MOCK_PAYMENT',
        email,
        customerName,
        items: {
          create: items.map(item => ({
            id: uuidv4(),
            productId: item.productId,
            itemType: 'PRODUCT',
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

    // Increment download counts for products
    for (const item of items) {
      if (item.productId) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { downloads: { increment: item.quantity } }
        }).catch(() => {}); // Ignore if product not found
      }
    }

    // Send confirmation email
    await sendOrderConfirmationEmail({
      email,
      orderNumber,
      items,
      total
    }).catch(err => console.error('Failed to send order email:', err));

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
