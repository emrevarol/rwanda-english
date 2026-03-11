import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getSpeakingTopic } from '@/lib/helpers'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const level = session.user.level || 'B1'

    // Try pool first (least used)
    const pooled = await prisma.speakingTopic.findFirst({
      where: { level },
      orderBy: { usedCount: 'asc' },
    })

    if (pooled) {
      await prisma.speakingTopic.update({
        where: { id: pooled.id },
        data: { usedCount: { increment: 1 } },
      })
      return NextResponse.json({ topic: pooled.topic })
    }

    // Fallback to hardcoded
    return NextResponse.json({ topic: getSpeakingTopic(level) })
  } catch (error) {
    console.error('Speaking topic error:', error)
    return NextResponse.json({ error: 'Failed to get topic' }, { status: 500 })
  }
}
