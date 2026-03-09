import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const date = req.nextUrl.searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'Missing date' }, { status: 400 })

  const [progress, writing, speaking, listening, chats] = await Promise.all([
    prisma.dailyProgress.findFirst({
      where: { userId: session.user.id, date },
    }),
    prisma.writingSubmission.findMany({
      where: {
        userId: session.user.id,
        createdAt: { gte: new Date(date + 'T00:00:00Z'), lt: new Date(date + 'T23:59:59Z') },
      },
      select: { taskType: true, band: true, createdAt: true },
    }),
    prisma.speakingSubmission.findMany({
      where: {
        userId: session.user.id,
        createdAt: { gte: new Date(date + 'T00:00:00Z'), lt: new Date(date + 'T23:59:59Z') },
      },
      select: { score: true, createdAt: true },
    }),
    prisma.listeningSession.findMany({
      where: {
        userId: session.user.id,
        createdAt: { gte: new Date(date + 'T00:00:00Z'), lt: new Date(date + 'T23:59:59Z') },
      },
      select: { score: true, createdAt: true },
    }),
    prisma.chatMessage.count({
      where: {
        userId: session.user.id,
        role: 'user',
        createdAt: { gte: new Date(date + 'T00:00:00Z'), lt: new Date(date + 'T23:59:59Z') },
      },
    }),
  ])

  return NextResponse.json({
    date,
    progress: progress ? {
      task1Done: progress.task1Done,
      task2Done: progress.task2Done,
      task1Type: progress.task1Type,
      task2Type: progress.task2Type,
      task1Mins: progress.task1Mins,
      task2Mins: progress.task2Mins,
    } : null,
    activities: {
      writing: writing.map((w) => ({ type: w.taskType, band: w.band, time: w.createdAt })),
      speaking: speaking.map((s) => ({ score: s.score, time: s.createdAt })),
      listening: listening.map((l) => ({ score: l.score, time: l.createdAt })),
      chatMessages: chats,
    },
    totalMins: (progress?.task1Mins || 0) + (progress?.task2Mins || 0),
  })
}
