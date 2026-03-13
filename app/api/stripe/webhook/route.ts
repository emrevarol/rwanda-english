import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        const userId = session.metadata?.userId
        const subscriptionId = session.subscription as string

        if (userId && subscriptionId) {
          const sub = await getStripe().subscriptions.retrieve(subscriptionId) as any
          const plan = sub.items?.data?.[0]?.price?.recurring?.interval === 'day' ? 'daily' : 'monthly'

          await prisma.user.update({
            where: { id: userId },
            data: {
              stripeCustomerId: session.customer as string,
              subscriptionId,
              subscriptionStatus: 'active',
              subscriptionPlan: plan,
              subscriptionEnd: new Date((sub.current_period_end || 0) * 1000),
            },
          })

          // Grant referral bonus: +7 days to the referrer
          const referral = await prisma.referral.findUnique({
            where: { referredId: userId },
          })
          if (referral && !referral.bonusGranted) {
            const referrer = await prisma.user.findUnique({
              where: { id: referral.referrerId },
              select: { subscriptionEnd: true, trialEndsAt: true, subscriptionStatus: true },
            })
            if (referrer) {
              const sevenDays = 7 * 24 * 60 * 60 * 1000
              const now = new Date()
              // Extend whichever is active: subscription or trial
              if (referrer.subscriptionStatus === 'active' && referrer.subscriptionEnd) {
                await prisma.user.update({
                  where: { id: referral.referrerId },
                  data: { subscriptionEnd: new Date(referrer.subscriptionEnd.getTime() + sevenDays) },
                })
              } else if (referrer.trialEndsAt) {
                const base = referrer.trialEndsAt > now ? referrer.trialEndsAt : now
                await prisma.user.update({
                  where: { id: referral.referrerId },
                  data: { trialEndsAt: new Date(base.getTime() + sevenDays) },
                })
              } else {
                // No active sub — give 7 days trial
                await prisma.user.update({
                  where: { id: referral.referrerId },
                  data: { trialEndsAt: new Date(now.getTime() + sevenDays) },
                })
              }
              await prisma.referral.update({
                where: { id: referral.id },
                data: { bonusGranted: true },
              })
            }
          }
        }
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription as string
        if (subscriptionId) {
          const sub = await getStripe().subscriptions.retrieve(subscriptionId) as any
          await prisma.user.updateMany({
            where: { subscriptionId },
            data: {
              subscriptionStatus: 'active',
              subscriptionEnd: new Date((sub.current_period_end || 0) * 1000),
            },
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as any
        await prisma.user.updateMany({
          where: { subscriptionId: sub.id },
          data: {
            subscriptionStatus: sub.status,
            subscriptionEnd: new Date((sub.current_period_end || 0) * 1000),
          },
        })
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as any
        await prisma.user.updateMany({
          where: { subscriptionId: sub.id },
          data: {
            subscriptionStatus: 'canceled',
            subscriptionId: null,
          },
        })
        break
      }
    }
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
