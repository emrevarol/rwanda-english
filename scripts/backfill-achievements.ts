import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function backfill() {
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, level: true } })

  for (const user of users) {
    console.log(`\nProcessing: ${user.name} (${user.email})`)

    const [writings, speakings, listenings, grammars, vocabs] = await Promise.all([
      prisma.writingSubmission.count({ where: { userId: user.id } }),
      prisma.speakingSubmission.count({ where: { userId: user.id } }),
      prisma.listeningSession.count({ where: { userId: user.id } }),
      prisma.grammarSession.count({ where: { userId: user.id } }),
      prisma.vocabularyProgress.count({ where: { userId: user.id } }),
    ])

    const [maxBand, maxSpeaking, maxListening] = await Promise.all([
      prisma.writingSubmission.aggregate({ where: { userId: user.id }, _max: { band: true } }),
      prisma.speakingSubmission.aggregate({ where: { userId: user.id }, _max: { score: true } }),
      prisma.listeningSession.aggregate({ where: { userId: user.id }, _max: { score: true } }),
    ])

    // Count streak
    const dailyProgress = await prisma.dailyProgress.findMany({
      where: { userId: user.id, OR: [{ task1Done: true }, { task2Done: true }] },
      select: { date: true },
      orderBy: { date: 'desc' },
    })

    let streak = 0
    if (dailyProgress.length > 0) {
      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      const dates = dailyProgress.map(d => d.date)
      if (dates[0] === today || dates[0] === yesterday) {
        streak = 1
        for (let i = 1; i < dates.length; i++) {
          const prev = new Date(dates[i - 1])
          const curr = new Date(dates[i])
          const diffDays = (prev.getTime() - curr.getTime()) / 86400000
          if (diffDays === 1) streak++
          else break
        }
      }
    }

    console.log(`  Stats: W=${writings} S=${speakings} L=${listenings} G=${grammars} V=${vocabs} Streak=${streak} Level=${user.level}`)
    console.log(`  Max: Band=${maxBand._max.band} Speaking=${maxSpeaking._max.score} Listening=${maxListening._max.score}`)

    const toUnlock: string[] = []

    // First steps
    if (writings >= 1) toUnlock.push('first_writing')
    if (speakings >= 1) toUnlock.push('first_speaking')
    if (listenings >= 1) toUnlock.push('first_listening')
    if (grammars >= 1) toUnlock.push('first_grammar')
    if (vocabs >= 1) toUnlock.push('first_vocab')

    // Volume
    for (const n of [10, 25, 50, 100]) {
      if (writings >= n) toUnlock.push(`writing_${n}`)
      if (speakings >= n) toUnlock.push(`speaking_${n}`)
      if (listenings >= n) toUnlock.push(`listening_${n}`)
      if (grammars >= n) toUnlock.push(`grammar_${n}`)
      if (vocabs >= n) toUnlock.push(`vocab_${n}`)
    }

    // Streaks
    if (streak >= 7) toUnlock.push('streak_7')
    if (streak >= 30) toUnlock.push('streak_30')
    if (streak >= 100) toUnlock.push('streak_100')

    // Levels
    const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    const userLevelIdx = levelOrder.indexOf(user.level)
    if (userLevelIdx >= 2) toUnlock.push('level_b1')
    if (userLevelIdx >= 3) toUnlock.push('level_b2')
    if (userLevelIdx >= 4) toUnlock.push('level_c1')
    if (userLevelIdx >= 5) toUnlock.push('level_c2')

    // Excellence
    if ((maxBand._max.band || 0) >= 8) toUnlock.push('writing_band8')
    if ((maxSpeaking._max.score || 0) >= 9) toUnlock.push('speaking_9')
    if ((maxListening._max.score || 0) >= 100) toUnlock.push('listening_perfect')

    console.log(`  Achievements to create: ${toUnlock.length}`)

    const icons: Record<string, string> = {
      first_writing: '✍️', first_speaking: '🎙️', first_listening: '🎧', first_grammar: '📝', first_vocab: '🧠',
      streak_7: '🔥', streak_30: '⭐', streak_100: '🏆',
      writing_band8: '🏅', speaking_9: '🎖️', listening_perfect: '💯',
      level_b1: '📈', level_b2: '📈', level_c1: '🚀', level_c2: '👑',
    }

    for (const key of toUnlock) {
      try {
        await prisma.userAchievement.create({
          data: { userId: user.id, achievementKey: key },
        })
        const icon = icons[key] || (key.startsWith('writing') ? '✍️' : key.startsWith('speaking') ? '🎙️' : key.startsWith('listening') ? '🎧' : key.startsWith('grammar') ? '📝' : '🧠')
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'achievement',
            title: `${icon} Achievement Unlocked!`,
            body: key,
          },
        })
        console.log(`    ✅ ${key}`)
      } catch {
        console.log(`    ⏭️ ${key} (already exists)`)
      }
    }
  }

  console.log('\nDone!')
  await prisma.$disconnect()
}

backfill().catch(console.error)
