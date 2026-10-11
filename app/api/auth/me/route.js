export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    
    // Anonymous visitors are normal (the header asks on every page): answer 200 so browsers don't log a console error
    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' });
    }
    
    const user = await verifyAuth(token);
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid token' });
    }
    
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    
    return NextResponse.json({
      success: true,
      user: dbUser
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
