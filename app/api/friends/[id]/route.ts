import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// PATCH: accept/reject friend request
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { action } = await req.json() // 'accept' or 'reject'

  const friendship = await prisma.friendship.findFirst({
    where: { id, friendId: session.user.id, status: 'pending' },
  })
  if (!friendship) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (action === 'accept') {
    await prisma.friendship.update({ where: { id }, data: { status: 'accepted' } })
  } else {
    await prisma.friendship.delete({ where: { id } })
  }

  return NextResponse.json({ ok: true })
}

// DELETE: remove friend
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.friendship.deleteMany({
    where: {
      id,
      OR: [{ userId: session.user.id }, { friendId: session.user.id }],
    },
  })

  return NextResponse.json({ ok: true })
}
