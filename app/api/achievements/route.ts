import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ACHIEVEMENTS } from '@/lib/achievements'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId: session.user.id },
      orderBy: { unlockedAt: 'desc' },
    })

    const unlockedMap = new Map(userAchievements.map(a => [a.achievementKey, a.unlockedAt]))

    const all = ACHIEVEMENTS.map(def => ({
      ...def,
      unlocked: unlockedMap.has(def.key),
      unlockedAt: unlockedMap.get(def.key) || null,
    }))

    return NextResponse.json({
      all,
      unlockedCount: userAchievements.length,
      totalCount: ACHIEVEMENTS.length,
    })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
