import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET: list friends (accepted) + pending requests
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [sent, received] = await Promise.all([
    prisma.friendship.findMany({
      where: { userId: session.user.id },
      include: { friend: { select: { id: true, name: true, email: true, level: true } } },
    }),
    prisma.friendship.findMany({
      where: { friendId: session.user.id },
      include: { user: { select: { id: true, name: true, email: true, level: true } } },
    }),
  ])

  const friends = [
    ...sent.filter((f) => f.status === 'accepted').map((f) => ({ ...f.friend, friendshipId: f.id })),
    ...received.filter((f) => f.status === 'accepted').map((f) => ({ ...f.user, friendshipId: f.id })),
  ]

  const pendingSent = sent.filter((f) => f.status === 'pending').map((f) => ({ ...f.friend, friendshipId: f.id }))
  const pendingReceived = received.filter((f) => f.status === 'pending').map((f) => ({ ...f.user, friendshipId: f.id }))

  return NextResponse.json({ friends, pendingSent, pendingReceived })
}

// POST: send friend request
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { friendId } = await req.json()
  if (!friendId || friendId === session.user.id) {
    return NextResponse.json({ error: 'Invalid friend' }, { status: 400 })
  }

  // Check if already exists
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userId: session.user.id, friendId },
        { userId: friendId, friendId: session.user.id },
      ],
    },
  })
  if (existing) return NextResponse.json({ error: 'Already exists' }, { status: 400 })

  const friendship = await prisma.friendship.create({
    data: { userId: session.user.id, friendId },
  })

  return NextResponse.json(friendship)
}
