import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getStripe, PRICES } from '@/lib/stripe'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan } = await req.json()
    if (!plan || !['daily', 'monthly'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true, isStudent: true, email: true, name: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId
    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: session.user.id },
      })
      customerId = customer.id
      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customerId },
      })
    }

    // Select price based on plan and student status
    const priceId = user.isStudent
      ? plan === 'daily' ? PRICES.dailyStudent : PRICES.monthlyStudent
      : plan === 'daily' ? PRICES.daily : PRICES.monthly

    const origin = req.headers.get('origin') || 'https://english.cash'

    const checkoutSession = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/en/dashboard?payment=success`,
      cancel_url: `${origin}/en/pricing?payment=cancelled`,
      metadata: { userId: session.user.id },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    const keyPreview = process.env.STRIPE_SECRET_KEY
      ? `${process.env.STRIPE_SECRET_KEY.slice(0, 10)}...${process.env.STRIPE_SECRET_KEY.slice(-4)} (len=${process.env.STRIPE_SECRET_KEY.length})`
      : 'MISSING'
    return NextResponse.json({
      error: error.message || 'Failed to create checkout session',
      type: error.type,
      code: error.code,
      keyPreview,
    }, { status: 500 })
  }
}
