import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getTodayDayNumber, getDayPlan } from '@/lib/learningPath'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const allProgress = await prisma.dailyProgress.findMany({
      where: { userId: session.user.id },
      orderBy: { date: 'asc' },
    })

    const dayNumber = getTodayDayNumber(user.createdAt)

    // Build 365-day grid: for each day, what's the status?
    // completedMap: date string -> { task1Done, task2Done }
    const completedMap: Record<string, { task1Done: boolean; task2Done: boolean }> = {}
    for (const p of allProgress) {
      completedMap[p.date] = { task1Done: p.task1Done, task2Done: p.task2Done }
    }

    // Build last 52 weeks (364 days) for the heatmap
    // Days before user registration are marked as -1 (not applicable)
    const today = new Date()
    const userJoinDate = new Date(user.createdAt)
    userJoinDate.setHours(0, 0, 0, 0)
    const heatmapDays: Array<{ date: string; count: number }> = []
    for (let i = 363; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      const dateStr = d.toISOString().split('T')[0]
      if (d < userJoinDate) {
        heatmapDays.push({ date: dateStr, count: -1 }) // before registration
      } else {
        const progress = completedMap[dateStr]
        const count = progress
          ? (progress.task1Done ? 1 : 0) + (progress.task2Done ? 1 : 0)
          : 0
        heatmapDays.push({ date: dateStr, count })
      }
    }

    // Full 365-day plan preview
    const upcomingDays = Array.from({ length: 365 }, (_, i) => {
      const d = i + 1
      const plan = getDayPlan(d, user.level)
      // find date for this day
      const dayDate = new Date(user.createdAt)
      dayDate.setDate(dayDate.getDate() + d - 1)
      const dateStr = dayDate.toISOString().split('T')[0]
      const progress = completedMap[dateStr] || { task1Done: false, task2Done: false }
      return {
        day: d,
        themeKey: plan.themeKey,
        theme: plan.theme,
        task1: { icon: plan.task1.icon, titleKey: plan.task1.titleKey, title: plan.task1.titleKey },
        task2: { icon: plan.task2.icon, titleKey: plan.task2.titleKey, title: plan.task2.titleKey },
        task1Done: progress.task1Done,
        task2Done: progress.task2Done,
        isToday: d === dayNumber,
        isPast: d < dayNumber,
      }
    })

    return NextResponse.json({ heatmapDays, upcomingDays, currentDay: dayNumber })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
