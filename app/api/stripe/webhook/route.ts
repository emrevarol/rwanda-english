import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
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
          const sub = await stripe.subscriptions.retrieve(subscriptionId) as any
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
        }
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription as string
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId) as any
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
