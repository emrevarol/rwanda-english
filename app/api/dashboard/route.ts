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

    const [writing, speaking, listening, user, vocabTotal, vocabMastered, vocabRecent] = await Promise.all([
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
      prisma.vocabularyProgress.count({ where: { userId: session.user.id } }),
      prisma.vocabularyProgress.count({ where: { userId: session.user.id, mastery: { gte: 3 } } }),
      prisma.vocabularyProgress.findMany({
        where: { userId: session.user.id },
        orderBy: { lastSeen: 'desc' },
        take: 5,
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

    // Calculate vocabulary and grammar sub-scores from writing submissions
    const writingWithVocab = writing.filter((w) => w.vocabularyScore != null)
    const writingWithGrammar = writing.filter((w) => w.grammarScore != null)
    const avgVocabularyWriting = writingWithVocab.length > 0
      ? writingWithVocab.reduce((sum, w) => sum + (w.vocabularyScore || 0), 0) / writingWithVocab.length
      : null
    const avgGrammar = writingWithGrammar.length > 0
      ? writingWithGrammar.reduce((sum, w) => sum + (w.grammarScore || 0), 0) / writingWithGrammar.length
      : null

    // Vocabulary mastery score from vocab practice (0-100%)
    const vocabMasteryPct = vocabTotal > 0
      ? Math.round((vocabMastered / vocabTotal) * 100)
      : null

    const recentActivity = [
      ...writing.map(w => ({
        id: w.id,
        type: 'writing' as const,
        date: w.createdAt,
        score: w.band,
        detail: w.taskType,
        prompt: w.prompt,
        response: w.response,
        feedback: w.feedback,
        vocabularyScore: w.vocabularyScore,
        grammarScore: w.grammarScore,
      })),
      ...speaking.map(s => ({
        id: s.id,
        type: 'speaking' as const,
        date: s.createdAt,
        score: s.score,
        detail: 'Speaking exercise',
        transcript: s.transcript,
        feedback: s.feedback,
      })),
      ...listening.map(l => ({
        id: l.id,
        type: 'listening' as const,
        date: l.createdAt,
        score: l.score,
        detail: 'Listening exercise',
        passage: l.passage,
      })),
      ...vocabRecent.map(v => ({
        id: v.id,
        type: 'vocabulary' as const,
        date: v.lastSeen,
        score: v.mastery,
        detail: v.word,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8)

    // Level progression check
    const totalSubmissions = writing.length + speaking.length + listening.length
    let levelUp = null
    if (user && totalSubmissions >= 5) {
      const thresholds: Record<string, { next: string; writing: number; speaking: number; listening: number }> = {
        A1: { next: 'A2', writing: 3, speaking: 4, listening: 50 },
        A2: { next: 'B1', writing: 4, speaking: 5, listening: 60 },
        B1: { next: 'B2', writing: 5.5, speaking: 6, listening: 70 },
        B2: { next: 'C1', writing: 6.5, speaking: 7, listening: 80 },
        C1: { next: 'C2', writing: 7.5, speaking: 8, listening: 90 },
      }
      const t = thresholds[user.level]
      if (t && avgWriting >= t.writing && avgSpeaking >= t.speaking && avgListening >= t.listening) {
        await prisma.user.update({ where: { id: user.id }, data: { level: t.next } })
        levelUp = { from: user.level, to: t.next }
      }
    }

    return NextResponse.json({
      level: levelUp ? levelUp.to : (user?.level || 'B1'),
      levelUp,
      avgWriting: Math.round(avgWriting * 10) / 10,
      avgSpeaking: Math.round(avgSpeaking * 10) / 10,
      avgListening: Math.round(avgListening * 10) / 10,
      avgVocabulary: avgVocabularyWriting != null ? Math.round(avgVocabularyWriting * 10) / 10 : null,
      vocabMasteryPct,
      vocabTotal,
      vocabMastered,
      avgGrammar: avgGrammar != null ? Math.round(avgGrammar * 10) / 10 : null,
      writingHistory: writing.map(w => ({ date: w.createdAt, score: w.band })),
      speakingHistory: speaking.map(s => ({ date: s.createdAt, score: s.score })),
      listeningHistory: listening.map(l => ({ date: l.createdAt, score: l.score })),
      vocabHistory: vocabRecent.map(v => ({ date: v.lastSeen, score: (v.mastery / 3) * 10 })),
      recentActivity,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
