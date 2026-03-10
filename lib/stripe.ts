import Stripe from 'stripe'
import { prisma } from './db'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  }
  return _stripe
}

export const PRICES = {
  daily: process.env.STRIPE_PRICE_DAILY!,
  monthly: process.env.STRIPE_PRICE_MONTHLY!,
  dailyStudent: process.env.STRIPE_PRICE_DAILY_STUDENT!,
  monthlyStudent: process.env.STRIPE_PRICE_MONTHLY_STUDENT!,
}

export async function hasActiveAccess(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { trialEndsAt: true, subscriptionStatus: true, subscriptionEnd: true },
  })
  if (!user) return false

  const now = new Date()

  // Check free trial
  if (user.trialEndsAt && user.trialEndsAt > now) return true

  // Check active subscription
  if (
    user.subscriptionStatus === 'active' &&
    user.subscriptionEnd &&
    user.subscriptionEnd > now
  ) return true

  return false
}
