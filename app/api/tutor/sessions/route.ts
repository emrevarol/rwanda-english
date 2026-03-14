import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET: list all sessions
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')?.toLowerCase()

  const sessions = await prisma.chatSession.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    include: { messages: { select: { content: true, role: true }, orderBy: { createdAt: 'asc' } } },
  })

  const results = sessions
    .filter((s) => {
      if (!query) return true
      if (s.title.toLowerCase().includes(query)) return true
      return s.messages.some((m) => m.content.toLowerCase().includes(query))
    })
    .map((s) => ({
      id: s.id,
      title: s.title,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      preview: s.messages[0]?.content?.slice(0, 80) || '',
    }))

  return NextResponse.json(results)
}

// POST: create new session
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const chatSession = await prisma.chatSession.create({
    data: { userId: session.user.id, title: 'New Chat' },
  })

  return NextResponse.json({ id: chatSession.id })
}
