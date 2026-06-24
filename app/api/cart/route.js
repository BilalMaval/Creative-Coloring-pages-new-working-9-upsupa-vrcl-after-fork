import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// Get cart items
export async function GET(request) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const user = await verifyAuth(token);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Please login to view cart' },
        { status: 401 }
      );
    }
    
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    });
    
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: dbUser.id },
      include: {
        product: {
          include: {
            category: true
          }
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      items: cartItems
    });
  } catch (error) {
    console.error('Get cart error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

// Add to cart
export async function POST(request) {
  try {
    const { productId, quantity = 1 } = await request.json();
    
    const token = request.cookies.get('auth_token')?.value;
    const user = await verifyAuth(token);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Please login to add items to cart' },
        { status: 401 }
      );
    }
    
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    });
    
    // Check if product exists and is not free
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }
    
    if (product.isFree) {
      return NextResponse.json(
        { success: false, error: 'Free products can be downloaded directly' },
        { status: 400 }
      );
    }
    
    // Check if already in cart
    const existing = await prisma.cartItem.findFirst({
      where: {
        userId: dbUser.id,
        productId: productId
      }
    });
    
    if (existing) {
      // Update quantity
      const updated = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity }
      });
      
      return NextResponse.json({
        success: true,
        message: 'Cart updated',
        item: updated
      });
    } else {
      // Add new item
      const cartItem = await prisma.cartItem.create({
        data: {
          userId: dbUser.id,
          productId: productId,
          quantity: quantity
        }
      });
      
      return NextResponse.json({
        success: true,
        message: 'Added to cart',
        item: cartItem
      });
    }
  } catch (error) {
    console.error('Add to cart error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add to cart' },
      { status: 500 }
    );
  }
}

// Remove from cart
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('id');
    
    const token = request.cookies.get('auth_token')?.value;
    const user = await verifyAuth(token);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Please login' },
        { status: 401 }
      );
    }
    
    await prisma.cartItem.delete({
      where: { id: itemId }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Item removed from cart'
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove item' },
      { status: 500 }
    );
  }
}
