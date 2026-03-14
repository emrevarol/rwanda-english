import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { analyzeSpeaking } from '@/lib/claude'
import { prisma } from '@/lib/db'
import { isMockMode, mockSpeakingFeedback } from '@/lib/mock'
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

    const { transcript, topic, analytics } = await req.json()

    if (!transcript || !topic) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const feedback = isMockMode()
      ? mockSpeakingFeedback
      : await analyzeSpeaking(transcript, topic, session.user.level, session.user.language, analytics, rateCheck.model)

    await prisma.speakingSubmission.create({
      data: {
        userId: session.user.id,
        transcript,
        feedback: JSON.stringify(feedback),
        score: feedback.score || 5,
      },
    })

    const { checkAchievements } = await import('@/lib/achievementChecker')
    const newAchievements = await checkAchievements(session.user.id, { type: 'speaking', score: feedback.score || 5 })

    return NextResponse.json({ ...feedback, newAchievements })
  } catch (error) {
    console.error('Speaking analyze error:', error)
    return NextResponse.json({ error: 'Failed to analyze speaking' }, { status: 500 })
  }
}
