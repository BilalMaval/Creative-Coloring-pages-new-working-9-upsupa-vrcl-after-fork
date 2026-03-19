import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { sendSubscriptionWelcomeEmail } from '@/lib/email';
import { getBrandByDomain } from '@/config/brands';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email } = body;
    
    // Get current domain for brand-specific emails
    const headersList = await headers();
    const host = headersList.get('host') || '';
    const brand = getBrandByDomain(host);
    
    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    // Check if already subscribed
    const existing = await prisma.subscriber.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (existing) {
      if (existing.isActive) {
        return NextResponse.json(
          { success: false, error: 'This email is already subscribed' },
          { status: 400 }
        );
      } else {
        // Reactivate subscription
        await prisma.subscriber.update({
          where: { email: email.toLowerCase() },
          data: { name, isActive: true }
        });
        return NextResponse.json({
          success: true,
          message: 'Welcome back! Your subscription has been reactivated.'
        });
      }
    }
    
    // Create new subscriber
    await prisma.subscriber.create({
      data: {
        name,
        email: email.toLowerCase(),
        isActive: true
      }
    });
    
    // Send brand-specific welcome email
    try {
      await sendSubscriptionWelcomeEmail({
        name,
        email: email.toLowerCase(),
        brandDomain: host
      });
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't fail the subscription if email fails
    }
    
    return NextResponse.json({
      success: true,
      message: `Thank you for subscribing to ${brand.name}! Check your email for confirmation.`
    });
  } catch (error) {
    console.error('Error creating subscriber:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to subscribe. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const subscribers = await prisma.subscriber.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({
      success: true,
      data: subscribers,
      count: subscribers.length
    });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscribers' },
      { status: 500 }
    );
  }
}
