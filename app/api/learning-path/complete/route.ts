import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getTodayString } from '@/lib/learningPath'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { task, minutes } = await req.json() // task: 'task1' | 'task2', minutes: number
    const today = getTodayString()
    const mins = Math.max(0, Math.min(120, Math.round(minutes || 0)))

    const data = task === 'task1'
      ? { task1Done: true, task1Mins: mins }
      : { task2Done: true, task2Mins: mins }

    await prisma.dailyProgress.updateMany({
      where: { userId: session.user.id, date: today },
      data,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to mark complete' }, { status: 500 })
  }
}
