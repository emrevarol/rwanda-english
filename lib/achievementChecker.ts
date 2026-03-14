import { prisma } from '@/lib/db'
import { ACHIEVEMENT_MAP, type AchievementDef } from '@/lib/achievements'

export type AchievementContext =
  | { type: 'writing'; band: number }
  | { type: 'speaking'; score: number }
  | { type: 'listening'; score: number }
  | { type: 'grammar' }
  | { type: 'vocabulary' }
  | { type: 'streak'; count: number }
  | { type: 'level_up'; newLevel: string }

export interface NewAchievement {
  key: string
  icon: string
  category: string
}

export async function checkAchievements(
  userId: string,
  context: AchievementContext
): Promise<NewAchievement[]> {
  try {
    // Get already unlocked keys
    const existing = await prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementKey: true },
    })
    const unlocked = new Set(existing.map(e => e.achievementKey))

    const toUnlock: string[] = []

    if (context.type === 'writing') {
      const count = await prisma.writingSubmission.count({ where: { userId } })
      if (!unlocked.has('first_writing')) toUnlock.push('first_writing')
      for (const n of [10, 25, 50, 100]) {
        const key = `writing_${n}`
        if (count >= n && !unlocked.has(key)) toUnlock.push(key)
      }
      if (context.band >= 8 && !unlocked.has('writing_band8')) toUnlock.push('writing_band8')
    }

    if (context.type === 'speaking') {
      const count = await prisma.speakingSubmission.count({ where: { userId } })
      if (!unlocked.has('first_speaking')) toUnlock.push('first_speaking')
      for (const n of [10, 25, 50, 100]) {
        const key = `speaking_${n}`
        if (count >= n && !unlocked.has(key)) toUnlock.push(key)
      }
      if (context.score >= 9 && !unlocked.has('speaking_9')) toUnlock.push('speaking_9')
    }

    if (context.type === 'listening') {
      const count = await prisma.listeningSession.count({ where: { userId } })
      if (!unlocked.has('first_listening')) toUnlock.push('first_listening')
      for (const n of [10, 25, 50, 100]) {
        const key = `listening_${n}`
        if (count >= n && !unlocked.has(key)) toUnlock.push(key)
      }
      if (context.score >= 100 && !unlocked.has('listening_perfect')) toUnlock.push('listening_perfect')
    }

    if (context.type === 'grammar') {
      const count = await prisma.grammarSession.count({ where: { userId } })
      if (!unlocked.has('first_grammar')) toUnlock.push('first_grammar')
      for (const n of [10, 25, 50, 100]) {
        const key = `grammar_${n}`
        if (count >= n && !unlocked.has(key)) toUnlock.push(key)
      }
    }

    if (context.type === 'vocabulary') {
      const count = await prisma.vocabularyProgress.count({ where: { userId } })
      if (!unlocked.has('first_vocab')) toUnlock.push('first_vocab')
      for (const n of [10, 25, 50, 100]) {
        const key = `vocab_${n}`
        if (count >= n && !unlocked.has(key)) toUnlock.push(key)
      }
    }

    if (context.type === 'streak') {
      for (const n of [7, 30, 100]) {
        const key = `streak_${n}`
        if (context.count >= n && !unlocked.has(key)) toUnlock.push(key)
      }
    }

    if (context.type === 'level_up') {
      const levelKeys: Record<string, string> = { B1: 'level_b1', B2: 'level_b2', C1: 'level_c1', C2: 'level_c2' }
      const key = levelKeys[context.newLevel]
      if (key && !unlocked.has(key)) toUnlock.push(key)
    }

    if (toUnlock.length === 0) return []

    // Create achievements and notifications in a transaction
    const newAchievements: NewAchievement[] = []

    await prisma.$transaction(async (tx) => {
      for (const key of toUnlock) {
        const def = ACHIEVEMENT_MAP[key]
        if (!def) continue

        try {
          await tx.userAchievement.create({
            data: { userId, achievementKey: key },
          })

          const categoryTitles: Record<string, string> = {
            first_steps: 'First Steps',
            consistency: 'Consistency',
            volume: 'Volume Milestone',
            level: 'Level Up',
            excellence: 'Excellence',
          }

          await tx.notification.create({
            data: {
              userId,
              type: 'achievement',
              title: categoryTitles[def.category] || 'Achievement',
              body: key,
            },
          })

          newAchievements.push({ key, icon: def.icon, category: def.category })
        } catch {
          // Unique constraint violation — already exists, skip
        }
      }
    })

    return newAchievements
  } catch (error) {
    console.error('Achievement check error:', error)
    return []
  }
}
