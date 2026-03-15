import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email } = body;
    
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
    
    // Send confirmation email using Brevo
    try {
      const brevoApiKey = process.env.BREVO_API_KEY;
      if (brevoApiKey) {
        await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': brevoApiKey,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            sender: { name: 'Creative Coloring Pages', email: 'noreply@creativecoloringpages.online' },
            to: [{ email: email.toLowerCase(), name }],
            subject: 'Welcome to Creative Coloring Pages! 🎨',
            htmlContent: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #8b5cf6;">🎨 Welcome to Creative Coloring Pages!</h1>
                </div>
                <p>Hi ${name},</p>
                <p>Thank you for subscribing to our newsletter! You'll be the first to know about:</p>
                <ul>
                  <li>New coloring pages and printables</li>
                  <li>Special offers and free downloads</li>
                  <li>Creative tips and coloring techniques</li>
                </ul>
                <p>Happy coloring! 🌈</p>
                <p style="margin-top: 30px; color: #666; font-size: 12px;">
                  If you didn't subscribe, you can ignore this email.
                </p>
              </div>
            `
          })
        });
      }
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't fail the subscription if email fails
    }
    
    return NextResponse.json({
      success: true,
      message: 'Thank you for subscribing! Check your email for confirmation.'
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
