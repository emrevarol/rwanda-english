import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getTodayString } from '@/lib/learningPath'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { task } = await req.json() // 'task1' | 'task2'
    const today = getTodayString()

    const updated = await prisma.dailyProgress.updateMany({
      where: { userId: session.user.id, date: today },
      data: task === 'task1' ? { task1Done: true } : { task2Done: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to mark complete' }, { status: 500 })
  }
}
