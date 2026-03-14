import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { score, total, mins } = await req.json()

    const grammarSession = await prisma.grammarSession.create({
      data: {
        userId: session.user.id,
        score: score || 0,
        total: total || 0,
        mins: mins || 0,
      },
    })

    const { checkAchievements } = await import('@/lib/achievementChecker')
    const newAchievements = await checkAchievements(session.user.id, { type: 'grammar' })

    return NextResponse.json({ ...grammarSession, newAchievements })
  } catch (error) {
    console.error('Grammar complete error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
