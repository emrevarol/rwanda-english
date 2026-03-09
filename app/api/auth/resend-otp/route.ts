import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.emailVerified) {
      return NextResponse.json({ success: true, alreadyVerified: true })
    }

    // Invalidate old codes
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
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    })

    console.log(`\n📧 OTP for ${email}: ${code}\n`)

    return NextResponse.json({
      success: true,
      ...(process.env.NODE_ENV === 'development' && { otp: code }),
    })
  } catch (error) {
    console.error('Resend OTP error:', error)
    return NextResponse.json({ error: 'Failed to resend code' }, { status: 500 })
  }
}
