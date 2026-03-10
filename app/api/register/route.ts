import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { sendOtpEmail } from '@/lib/email'

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, language } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing && existing.emailVerified) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // If user exists but not verified, update their info
    const user = existing
      ? await prisma.user.update({
          where: { email },
          data: { name, password: hashedPassword, language: language || 'en' },
        })
      : await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            language: language || 'en',
            level: 'B1',
            emailVerified: false,
            trialEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3-day free trial
          },
        })

    // Invalidate old OTP codes
    await prisma.otpCode.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    })

    // Generate new OTP
    const code = generateOtp()
    await prisma.otpCode.create({
      data: {
        userId: user.id,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    })

    // Send OTP via email
    try {
      await sendOtpEmail(email, code, name)
    } catch (emailErr) {
      console.error('Email send failed:', emailErr)
      // Still return success — user can request resend
    }

    return NextResponse.json({
      success: true,
      requiresVerification: true,
      email,
      // Only include OTP in dev mode for testing
      ...(process.env.NODE_ENV === 'development' && { otp: code }),
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}
