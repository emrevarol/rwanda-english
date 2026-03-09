import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET: load messages for a session
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const chatSession = await prisma.chatSession.findFirst({
    where: { id, userId: session.user.id },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  })

  if (!chatSession) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    id: chatSession.id,
    title: chatSession.title,
    messages: chatSession.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  })
}

// DELETE: delete a session
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  await prisma.chatMessage.deleteMany({ where: { sessionId: id } })
  await prisma.chatSession.deleteMany({ where: { id, userId: session.user.id } })

  return NextResponse.json({ ok: true })
}
