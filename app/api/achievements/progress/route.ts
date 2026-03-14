import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

const MILESTONES = [1, 10, 25, 50, 100]

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id

    const [writings, speakings, listenings, grammars, vocabs] = await Promise.all([
      prisma.writingSubmission.count({ where: { userId } }),
      prisma.speakingSubmission.count({ where: { userId } }),
      prisma.listeningSession.count({ where: { userId } }),
      prisma.grammarSession.count({ where: { userId } }),
      prisma.vocabularyProgress.count({ where: { userId } }),
    ])

    const getNext = (count: number) => {
      const next = MILESTONES.find(m => m > count)
      return next ? { next, current: count, pct: Math.round((count / next) * 100) } : { next: null, current: count, pct: 100 }
    }

    return NextResponse.json({
      writing: getNext(writings),
      speaking: getNext(speakings),
      listening: getNext(listenings),
      grammar: getNext(grammars),
      vocabulary: getNext(vocabs),
    })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
