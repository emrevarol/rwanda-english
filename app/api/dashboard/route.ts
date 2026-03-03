import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [writing, speaking, listening, user] = await Promise.all([
      prisma.writingSubmission.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.speakingSubmission.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.listeningSession.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
      }),
    ])

    const avgWriting = writing.length > 0
      ? writing.reduce((sum, w) => sum + w.band, 0) / writing.length
      : 0

    const avgSpeaking = speaking.length > 0
      ? speaking.reduce((sum, s) => sum + s.score, 0) / speaking.length
      : 0

    const avgListening = listening.length > 0
      ? listening.reduce((sum, l) => sum + l.score, 0) / listening.length
      : 0

    const recentActivity = [
      ...writing.map(w => ({
        type: 'writing',
        date: w.createdAt,
        score: w.band,
        detail: w.taskType,
      })),
      ...speaking.map(s => ({
        type: 'speaking',
        date: s.createdAt,
        score: s.score,
        detail: 'Speaking exercise',
      })),
      ...listening.map(l => ({
        type: 'listening',
        date: l.createdAt,
        score: l.score,
        detail: 'Listening exercise',
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8)

    return NextResponse.json({
      level: user?.level || 'B1',
      avgWriting: Math.round(avgWriting * 10) / 10,
      avgSpeaking: Math.round(avgSpeaking * 10) / 10,
      avgListening: Math.round(avgListening * 10) / 10,
      writingHistory: writing.map(w => ({ date: w.createdAt, score: w.band })),
      speakingHistory: speaking.map(s => ({ date: s.createdAt, score: s.score })),
      recentActivity,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
