import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { analyzeWriting } from '@/lib/claude'
import { prisma } from '@/lib/db'
import { isMockMode, mockWritingFeedback } from '@/lib/mock'
import { hasActiveAccess } from '@/lib/stripe'
import { checkDailyLimit } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await hasActiveAccess(session.user.id))) {
      return NextResponse.json({ error: 'Subscription required', code: 'SUBSCRIPTION_REQUIRED' }, { status: 403 })
    }

    const rateCheck = await checkDailyLimit(session.user.id)
    if (!rateCheck.allowed) {
      return NextResponse.json({
        error: `Daily AI limit reached (${rateCheck.limit} actions). ${rateCheck.tier === 'free' ? 'Upgrade for more!' : 'Limit resets tomorrow.'}`,
        code: 'DAILY_LIMIT',
      }, { status: 429 })
    }

    const { text, prompt, taskType } = await req.json()

    if (!text || !prompt || !taskType) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    if (isMockMode()) {
      console.log('[writing] Mock mode active — returning mock feedback')
    } else {
      console.log(`[writing] Analyzing with Claude — level: ${session.user.level}, taskType: ${taskType}, length: ${text.length}`)
    }

    const feedback = isMockMode()
      ? mockWritingFeedback
      : await analyzeWriting(text, prompt, taskType, session.user.level, session.user.language, rateCheck.model)

    await prisma.writingSubmission.create({
      data: {
        userId: session.user.id,
        taskType,
        prompt,
        response: text,
        feedback: JSON.stringify(feedback),
        band: feedback.band || 5,
        vocabularyScore: feedback.vocabularyScore || null,
        grammarScore: feedback.grammarScore || null,
      },
    })

    return NextResponse.json(feedback)
  } catch (error) {
    console.error('Writing analyze error:', error)
    return NextResponse.json({ error: 'Failed to analyze writing' }, { status: 500 })
  }
}
