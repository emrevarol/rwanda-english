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

    const wantsWords = req.nextUrl.searchParams.get('words') === 'true'

    const [total, mastered, learning] = await Promise.all([
      prisma.vocabularyProgress.count({ where: { userId: session.user.id } }),
      prisma.vocabularyProgress.count({ where: { userId: session.user.id, mastery: { gte: 3 } } }),
      prisma.vocabularyProgress.count({ where: { userId: session.user.id, mastery: { gte: 1, lt: 3 } } }),
    ])

    const stats = {
      total,
      mastered,
      learning,
      new_words: total - mastered - learning,
    }

    if (wantsWords) {
      const words = await prisma.vocabularyProgress.findMany({
        where: { userId: session.user.id },
        orderBy: { lastSeen: 'desc' },
        take: 50,
      })
      return NextResponse.json({ stats, words })
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Vocabulary progress error:', error)
    return NextResponse.json({ error: 'Failed to get progress' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { word, correct } = await req.json()
    if (!word) {
      return NextResponse.json({ error: 'Missing word' }, { status: 400 })
    }

    const existing = await prisma.vocabularyProgress.findUnique({
      where: { userId_word: { userId: session.user.id, word } },
    })

    if (existing) {
      const newCorrect = existing.correct + (correct ? 1 : 0)
      const newIncorrect = existing.incorrect + (correct ? 0 : 1)
      // Mastery: 0=new, 1=learning, 2=reviewing, 3=mastered
      // Need 3 correct in a row-ish to master
      let newMastery = existing.mastery
      if (correct) {
        if (newCorrect >= 5 && newCorrect / (newCorrect + newIncorrect) >= 0.8) newMastery = 3
        else if (newCorrect >= 3) newMastery = 2
        else if (newCorrect >= 1) newMastery = 1
      } else {
        // Drop mastery on wrong answer
        if (newMastery > 0) newMastery = Math.max(1, newMastery - 1)
      }

      await prisma.vocabularyProgress.update({
        where: { id: existing.id },
        data: {
          correct: newCorrect,
          incorrect: newIncorrect,
          mastery: newMastery,
          lastSeen: new Date(),
        },
      })
    } else {
      await prisma.vocabularyProgress.create({
        data: {
          userId: session.user.id,
          word,
          definition: '',
          example: '',
          level: session.user.level,
          mastery: correct ? 1 : 0,
          correct: correct ? 1 : 0,
          incorrect: correct ? 0 : 1,
        },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Vocabulary progress save error:', error)
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
  }
}
