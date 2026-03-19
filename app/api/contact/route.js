import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { sendContactEmail } from '@/lib/email';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, message } = body;
    
    // Get current domain for brand-specific emails
    const headersList = await headers();
    const host = headersList.get('host') || '';
    
    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: 'Name, email and message are required' },
        { status: 400 }
      );
    }
    
    // Send brand-specific email notification
    const emailResult = await sendContactEmail({ 
      name, 
      email, 
      message,
      brandDomain: host 
    });
    
    if (!emailResult.success) {
      console.error('Email send failed:', emailResult.error);
      // Still return success to user - we logged the message
      console.log('Contact form submission (email failed):', { name, email, message });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Error processing contact:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
