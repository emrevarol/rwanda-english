import { prisma } from './db'

// Daily AI action limits
const FREE_DAILY_LIMIT = 15   // tutor messages + speaking + writing combined
const PAID_DAILY_LIMIT = 50

// Models per tier
export const FREE_MODEL = 'claude-haiku-4-5-20251001'
export const PAID_MODEL = 'claude-sonnet-4-6'

export async function getUserTier(userId: string): Promise<'free' | 'paid'> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionStatus: true, subscriptionEnd: true, trialEndsAt: true },
  })
  if (!user) return 'free'

  const now = new Date()

  // Active subscription = paid
  if (user.subscriptionStatus === 'active' && user.subscriptionEnd && user.subscriptionEnd > now) {
    return 'paid'
  }

  // Trial users = free tier (they get access but with free limits)
  return 'free'
}

export function getModelForTier(tier: 'free' | 'paid'): string {
  return tier === 'paid' ? PAID_MODEL : FREE_MODEL
}

export function getDailyLimit(tier: 'free' | 'paid'): number {
  return tier === 'paid' ? PAID_DAILY_LIMIT : FREE_DAILY_LIMIT
}

/**
 * Check if user has remaining AI actions today.
 * Returns { allowed, remaining, limit } or { allowed: false, ... } if limit reached.
 */
export async function checkDailyLimit(userId: string): Promise<{
  allowed: boolean
  remaining: number
  limit: number
  tier: 'free' | 'paid'
  model: string
}> {
  const tier = await getUserTier(userId)
  const limit = getDailyLimit(tier)
  const model = getModelForTier(tier)

  const today = new Date().toISOString().slice(0, 10)

  // Count today's AI actions (tutor messages sent + speaking + writing submissions)
  const [tutorCount, speakingCount, writingCount] = await Promise.all([
    prisma.chatMessage.count({
      where: {
        userId,
        role: 'user',
        createdAt: { gte: new Date(today + 'T00:00:00Z') },
      },
    }),
    prisma.speakingSubmission.count({
      where: {
        userId,
        createdAt: { gte: new Date(today + 'T00:00:00Z') },
      },
    }),
    prisma.writingSubmission.count({
      where: {
        userId,
        createdAt: { gte: new Date(today + 'T00:00:00Z') },
      },
    }),
  ])

  const used = tutorCount + speakingCount + writingCount
  const remaining = Math.max(0, limit - used)

  return {
    allowed: remaining > 0,
    remaining,
    limit,
    tier,
    model,
  }
}
