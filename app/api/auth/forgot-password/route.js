import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email';

// Node.js runtime required for Prisma / crypto
export const runtime = 'nodejs';

// Temporary in-memory storage for reset tokens (use Redis/db in prod)
const resetTokens = new Map();

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists and is admin
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.role !== 'ADMIN') {
      // Do not reveal if email exists
      return NextResponse.json({
        success: true,
        message: 'If this email exists, a reset link has been sent.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry = Date.now() + 3600000; // 1 hour

    resetTokens.set(resetToken, { email, expiry });

    // Build reset URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/admin/reset-password?token=${resetToken}`;

    // Send reset email
    await sendPasswordResetEmail({ email, resetToken, resetUrl });

    return NextResponse.json({
      success: true,
      message: 'If this email exists, a reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// Export for use in reset-password route
export { resetTokens };
