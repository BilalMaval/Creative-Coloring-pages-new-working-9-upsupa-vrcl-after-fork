import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function POST(request) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const user = await verifyAuth(token);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Please login to checkout' },
        { status: 401 }
      );
    }
    
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    });
    
    // Get cart items
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: dbUser.id },
      include: { product: true }
    });
    
    if (cartItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart is empty' },
        { status: 400 }
      );
    }
    
    // Calculate total
    const total = cartItems.reduce((sum, item) => {
      return sum + (Number(item.product.price) * item.quantity);
    }, 0);
    
    // Create order
    const order = await prisma.order.create({
      data: {
        userId: dbUser.id,
        total: total,
        status: 'PENDING',
        orderItems: {
          create: cartItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price
          }))
        }
      },
      include: {
        orderItems: {
          include: { product: true }
        }
      }
    });
    
    // Clear cart
    await prisma.cartItem.deleteMany({
      where: { userId: dbUser.id }
    });
    
    // In a real implementation, you would create a Stripe checkout session here
    // For now, we'll simulate a successful payment
    
    // Update order status to completed (simulated payment)
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'COMPLETED' }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      orderId: order.id,
      // In production, return Stripe checkout URL
      checkoutUrl: `/dashboard?order=${order.id}`
    });
    
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { success: false, error: 'Checkout failed' },
      { status: 500 }
    );
  }
}
