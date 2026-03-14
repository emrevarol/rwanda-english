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

    const tab = req.nextUrl.searchParams.get('tab') || 'global' // global | friends

    // Get friend IDs if friends tab
    let friendIds: string[] = []
    if (tab === 'friends') {
      const [sent, received] = await Promise.all([
        prisma.friendship.findMany({
          where: { userId: session.user.id, status: 'accepted' },
          select: { friendId: true },
        }),
        prisma.friendship.findMany({
          where: { friendId: session.user.id, status: 'accepted' },
          select: { userId: true },
        }),
      ])
      friendIds = [
        session.user.id,
        ...sent.map(f => f.friendId),
        ...received.map(f => f.userId),
      ]
    }

    // Get all users (or friends only)
    const users = await prisma.user.findMany({
      where: tab === 'friends' ? { id: { in: friendIds } } : { assessmentDone: true },
      select: {
        id: true,
        name: true,
        level: true,
        avatar: true,
        createdAt: true,
      },
    })

    if (users.length === 0) {
      return NextResponse.json({ leaderboard: [], myRank: 0 })
    }

    const userIds = users.map(u => u.id)

    // Aggregate scores for all users in parallel
    const [writingAggs, speakingAggs, listeningAggs, vocabAggs, streakData] = await Promise.all([
      // Writing: avg band per user
      prisma.writingSubmission.groupBy({
        by: ['userId'],
        where: { userId: { in: userIds } },
        _avg: { band: true },
        _count: true,
      }),
      // Speaking: avg score per user
      prisma.speakingSubmission.groupBy({
        by: ['userId'],
        where: { userId: { in: userIds } },
        _avg: { score: true },
        _count: true,
      }),
      // Listening: avg score per user
      prisma.listeningSession.groupBy({
        by: ['userId'],
        where: { userId: { in: userIds } },
        _avg: { score: true },
        _count: true,
      }),
      // Vocabulary: sum correct/incorrect per user
      prisma.vocabularyProgress.groupBy({
        by: ['userId'],
        where: { userId: { in: userIds } },
        _sum: { correct: true, incorrect: true },
        _count: true,
      }),
      // Daily progress: count active days per user
      prisma.dailyProgress.groupBy({
        by: ['userId'],
        where: {
          userId: { in: userIds },
          OR: [{ task1Done: true }, { task2Done: true }],
        },
        _count: true,
      }),
    ])

    // Build lookup maps
    const writingMap = new Map(writingAggs.map(w => [w.userId, { avg: w._avg.band || 0, count: w._count }]))
    const speakingMap = new Map(speakingAggs.map(s => [s.userId, { avg: s._avg.score || 0, count: s._count }]))
    const listeningMap = new Map(listeningAggs.map(l => [l.userId, { avg: l._avg.score || 0, count: l._count }]))
    const vocabMap = new Map(vocabAggs.map(v => [v.userId, {
      correct: v._sum.correct || 0,
      incorrect: v._sum.incorrect || 0,
      words: v._count,
    }]))
    const streakMap = new Map(streakData.map(s => [s.userId, s._count]))

    // Calculate composite score for each user
    const leaderboard = users.map(user => {
      const w = writingMap.get(user.id)
      const s = speakingMap.get(user.id)
      const l = listeningMap.get(user.id)
      const v = vocabMap.get(user.id)
      const activeDays = streakMap.get(user.id) || 0

      // Normalize scores to 0-100
      const writingScore = w ? (w.avg / 9) * 100 : 0
      const speakingScore = s ? s.avg * 10 : 0
      const listeningScore = l ? l.avg : 0
      const vocabScore = v && (v.correct + v.incorrect) > 0
        ? (v.correct / (v.correct + v.incorrect)) * 100
        : 0

      const totalActivities = (w?.count || 0) + (s?.count || 0) + (l?.count || 0)

      // XP = weighted skill score + activity bonus + consistency bonus
      const skillScore = (writingScore * 0.3) + (speakingScore * 0.25) + (listeningScore * 0.25) + (vocabScore * 0.2)
      const activityBonus = Math.min(totalActivities * 5, 200) // cap at 200
      const consistencyBonus = Math.min(activeDays * 10, 300) // cap at 300
      const xp = Math.round(skillScore + activityBonus + consistencyBonus)

      return {
        id: user.id,
        name: user.name,
        level: user.level,
        avatar: user.avatar,
        xp,
        writingScore: Math.round(writingScore),
        speakingScore: Math.round(speakingScore),
        listeningScore: Math.round(listeningScore),
        vocabScore: Math.round(vocabScore),
        totalActivities,
        activeDays,
        vocabWords: v?.words || 0,
        isMe: user.id === session.user.id,
      }
    })
      .sort((a, b) => b.xp - a.xp)

    // Add rank
    const ranked = leaderboard.map((entry, i) => ({ ...entry, rank: i + 1 }))

    const myRank = ranked.find(e => e.isMe)?.rank || 0

    return NextResponse.json({ leaderboard: ranked, myRank })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}
