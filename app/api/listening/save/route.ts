import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { passage, score } = await req.json()

    await prisma.listeningSession.create({
      data: {
        userId: session.user.id,
        passage,
        score,
      },
    })

    const { checkAchievements } = await import('@/lib/achievementChecker')
    const newAchievements = await checkAchievements(session.user.id, { type: 'listening', score })

    return NextResponse.json({ success: true, newAchievements })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 })
  }
}
