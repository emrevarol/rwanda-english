import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getDayPlan, getTodayDayNumber, getTodayString } from '@/lib/learningPath'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const startDate = user.createdAt
    const dayNumber = getTodayDayNumber(startDate)
    const today = getTodayString()
    const plan = getDayPlan(dayNumber, user.level)

    // Get or create today's progress record
    let progress = await prisma.dailyProgress.findUnique({
      where: { userId_date: { userId: session.user.id, date: today } },
    })

    if (!progress) {
      progress = await prisma.dailyProgress.create({
        data: {
          userId: session.user.id,
          date: today,
          task1Type: plan.task1.type,
          task2Type: plan.task2.type,
          task1Done: false,
          task2Done: false,
        },
      })
    }

    // Get streak
    const allProgress = await prisma.dailyProgress.findMany({
      where: { userId: session.user.id, OR: [{ task1Done: true }, { task2Done: true }] },
      select: { date: true },
      orderBy: { date: 'desc' },
    })
    const completedDates = allProgress.map((p) => p.date)

    const { getStreakCount } = await import('@/lib/learningPath')
    const streak = getStreakCount(completedDates)

    return NextResponse.json({
      dayNumber,
      plan,
      progress: { task1Done: progress.task1Done, task2Done: progress.task2Done },
      streak,
      totalDays: 365,
    })
  } catch (error) {
    console.error('Learning path error:', error)
    return NextResponse.json({ error: 'Failed to fetch plan' }, { status: 500 })
  }
}
