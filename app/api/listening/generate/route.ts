import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateListeningContent } from '@/lib/claude'
import { prisma } from '@/lib/db'
import { isMockMode, mockListeningContent } from '@/lib/mock'
import { hasActiveAccess } from '@/lib/stripe'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await hasActiveAccess(session.user.id))) {
      return NextResponse.json({ error: 'Subscription required', code: 'SUBSCRIPTION_REQUIRED' }, { status: 403 })
    }

    if (isMockMode()) {
      return NextResponse.json(mockListeningContent)
    }

    const level = session.user.level || 'B1'
    const language = session.user.language || 'en'
    const topic = req.nextUrl.searchParams.get('topic') || 'general'

    // Try to get pre-generated content from pool (least used first)
    const pooled = await prisma.listeningContent.findFirst({
      where: { level, language, topic },
      orderBy: { usedCount: 'asc' },
    })

    if (pooled) {
      // Increment usage count
      await prisma.listeningContent.update({
        where: { id: pooled.id },
        data: { usedCount: { increment: 1 } },
      })
      return NextResponse.json({
        passage: pooled.passage,
        questions: JSON.parse(pooled.questions),
      })
    }

    // No pooled content — generate on-the-fly and save to pool
    const content = await generateListeningContent(level, language, topic)

    await prisma.listeningContent.create({
      data: {
        level,
        language,
        passage: content.passage,
        questions: JSON.stringify(content.questions),
        topic,
        usedCount: 1,
      },
    })

    return NextResponse.json(content)
  } catch (error: any) {
    console.error('Listening generate error:', error?.message || error)
    return NextResponse.json({
      error: 'Failed to generate content',
      detail: error?.message || String(error),
    }, { status: 500 })
  }
}
