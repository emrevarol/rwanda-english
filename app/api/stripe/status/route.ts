import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hasActiveAccess } from '@/lib/stripe'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        trialEndsAt: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionEnd: true,
        isStudent: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const access = await hasActiveAccess(session.user.id)

    return NextResponse.json({
      hasAccess: access,
      trialEndsAt: user.trialEndsAt,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionEnd: user.subscriptionEnd,
      isStudent: user.isStudent,
    })
  } catch (error) {
    console.error('Status error:', error)
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 })
  }
}
