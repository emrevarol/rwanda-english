import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkDailyLimit } from '@/lib/rateLimit'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await checkDailyLimit(session.user.id)
    return NextResponse.json({
      remaining: result.remaining,
      limit: result.limit,
      tier: result.tier,
      allowed: result.allowed,
    })
  } catch (error) {
    console.error('Usage check error:', error)
    return NextResponse.json({ error: 'Failed to check usage' }, { status: 500 })
  }
}
