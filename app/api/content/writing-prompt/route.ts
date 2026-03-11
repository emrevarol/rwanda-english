import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getWritingPrompt } from '@/lib/helpers'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const level = session.user.level || 'B1'
    const { searchParams } = new URL(req.url)
    const taskType = searchParams.get('taskType') || 'task2'

    // Try pool first (least used)
    const pooled = await prisma.writingPrompt.findFirst({
      where: { level, taskType },
      orderBy: { usedCount: 'asc' },
    })

    if (pooled) {
      await prisma.writingPrompt.update({
        where: { id: pooled.id },
        data: { usedCount: { increment: 1 } },
      })
      return NextResponse.json({ prompt: pooled.prompt })
    }

    // Fallback to hardcoded
    return NextResponse.json({ prompt: getWritingPrompt(taskType, level) })
  } catch (error) {
    console.error('Writing prompt error:', error)
    return NextResponse.json({ error: 'Failed to get prompt' }, { status: 500 })
  }
}
