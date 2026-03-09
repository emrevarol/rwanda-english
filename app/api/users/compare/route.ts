import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function getUserStats(userId: string) {
  const [writing, speaking, listening, progress, user] = await Promise.all([
    prisma.writingSubmission.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 10 }),
    prisma.speakingSubmission.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 10 }),
    prisma.listeningSession.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 10 }),
    prisma.dailyProgress.findMany({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, level: true } }),
  ])

  const avgWriting = writing.length > 0 ? writing.reduce((s, w) => s + w.band, 0) / writing.length : 0
  const avgSpeaking = speaking.length > 0 ? speaking.reduce((s, w) => s + w.score, 0) / speaking.length : 0
  const avgListening = listening.length > 0 ? listening.reduce((s, w) => s + w.score, 0) / listening.length : 0

  const daysCompleted = progress.filter((p) => p.task1Done && p.task2Done).length
  const totalSessions = progress.filter((p) => p.task1Done || p.task2Done).length

  // Calculate streak
  const completedDates = progress.filter((p) => p.task1Done && p.task2Done).map((p) => p.date).sort().reverse()
  let streak = 0
  if (completedDates.length > 0) {
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    if (completedDates[0] === today || completedDates[0] === yesterday) {
      streak = 1
      let current = new Date(completedDates[0])
      for (let i = 1; i < completedDates.length; i++) {
        current.setDate(current.getDate() - 1)
        if (completedDates[i] === current.toISOString().split('T')[0]) {
          streak++
        } else break
      }
    }
  }

  // Normalize scores to 0-100 for radar chart
  return {
    ...user,
    stats: {
      writing: Math.round(avgWriting * 100 / 9), // IELTS band 0-9 → 0-100
      speaking: Math.round(avgSpeaking),
      listening: Math.round(avgListening),
      consistency: Math.min(100, Math.round((daysCompleted / 30) * 100)), // % of last 30 days
      streak: Math.min(100, streak * 3), // streak normalized
      vocabulary: Math.round((avgWriting + avgSpeaking) * 100 / 18), // composite
    },
    raw: { avgWriting, avgSpeaking, avgListening, daysCompleted, totalSessions, streak },
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const friendId = req.nextUrl.searchParams.get('friendId')
  if (!friendId) return NextResponse.json({ error: 'Missing friendId' }, { status: 400 })

  // Check friendship
  const friendship = await prisma.friendship.findFirst({
    where: {
      status: 'accepted',
      OR: [
        { userId: session.user.id, friendId },
        { userId: friendId, friendId: session.user.id },
      ],
    },
  })
  if (!friendship) return NextResponse.json({ error: 'Not friends' }, { status: 403 })

  const [me, friend] = await Promise.all([
    getUserStats(session.user.id),
    getUserStats(friendId),
  ])

  return NextResponse.json({ me, friend })
}
