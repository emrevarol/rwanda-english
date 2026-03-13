import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

function generateCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase() // e.g. "A3F2B1C9"
}

// GET: get my referral code + stats
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { referralCode: true, subscriptionEnd: true, trialEndsAt: true },
  })

  // Auto-generate referral code if not exists
  if (!user?.referralCode) {
    let code = generateCode()
    // Ensure uniqueness
    while (await prisma.user.findUnique({ where: { referralCode: code } })) {
      code = generateCode()
    }
    user = await prisma.user.update({
      where: { id: session.user.id },
      data: { referralCode: code },
      select: { referralCode: true, subscriptionEnd: true, trialEndsAt: true },
    })
  }

  // Get referral stats
  const referrals = await prisma.referral.findMany({
    where: { referrerId: session.user.id },
    include: { referred: { select: { name: true, subscriptionStatus: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const totalReferred = referrals.length
  const premiumReferred = referrals.filter(r => r.bonusGranted).length
  const bonusDaysEarned = premiumReferred * 7

  return NextResponse.json({
    referralCode: user!.referralCode,
    totalReferred,
    premiumReferred,
    bonusDaysEarned,
    referrals: referrals.map(r => ({
      name: r.referred.name,
      isPremium: r.bonusGranted,
      date: r.createdAt,
    })),
  })
}
