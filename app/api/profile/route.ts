import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, level: true, avatar: true, bio: true },
  })

  return NextResponse.json(user)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const data: Record<string, string | null> = {}

  if (typeof body.avatar === 'string') {
    if (body.avatar && !body.avatar.startsWith('https://res.cloudinary.com/')) {
      return NextResponse.json({ error: 'Invalid avatar URL' }, { status: 400 })
    }
    data.avatar = body.avatar || null
  }

  if (typeof body.bio === 'string') {
    data.bio = body.bio.slice(0, 160) || null
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: { name: true, email: true, level: true, avatar: true, bio: true },
  })

  return NextResponse.json(user)
}
