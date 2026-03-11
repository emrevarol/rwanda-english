import { NextRequest, NextResponse } from 'next/server'
import {
  generateWritingPromptsBatch,
  generateSpeakingTopicsBatch,
  generateListeningContent,
} from '@/lib/claude'
import { prisma } from '@/lib/db'
import { isMockMode } from '@/lib/mock'

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const LANGUAGES = ['en', 'rw', 'tr']
const BATCH_SIZE = 25 // generate 25 items per API call

export async function POST(req: NextRequest) {
  const { secret, type, level, count } = await req.json()

  if (secret !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (isMockMode()) {
    return NextResponse.json({ error: 'Cannot seed in mock mode' }, { status: 400 })
  }

  const targetCount = count || 365
  const levels = level ? [level] : LEVELS
  const results: Array<{ type: string; level: string; language?: string; existing: number; created: number; error?: string }> = []

  // --- WRITING PROMPTS ---
  if (!type || type === 'writing') {
    for (const lvl of levels) {
      for (const taskType of ['task1', 'task2']) {
        const existing = await prisma.writingPrompt.count({
          where: { level: lvl, taskType },
        })

        const toCreate = Math.max(0, targetCount - existing)
        if (toCreate === 0) {
          results.push({ type: `writing-${taskType}`, level: lvl, existing, created: 0 })
          continue
        }

        // Get existing topics to avoid duplicates
        const existingPrompts = await prisma.writingPrompt.findMany({
          where: { level: lvl, taskType },
          select: { prompt: true },
          take: 50,
        })
        const existingTopics = existingPrompts.map((p) => p.prompt.slice(0, 60))

        let created = 0
        let batchesNeeded = Math.ceil(toCreate / BATCH_SIZE)

        for (let b = 0; b < batchesNeeded; b++) {
          const batchCount = Math.min(BATCH_SIZE, toCreate - created)
          try {
            const prompts = await generateWritingPromptsBatch(lvl, taskType, batchCount, existingTopics)

            for (const prompt of prompts) {
              if (created >= toCreate) break
              await prisma.writingPrompt.create({
                data: { level: lvl, taskType, prompt, topic: 'general' },
              })
              existingTopics.push(prompt.slice(0, 60))
              created++
            }
          } catch (err: any) {
            results.push({ type: `writing-${taskType}`, level: lvl, existing, created, error: err?.message })
            break
          }
        }

        if (!results.find((r) => r.type === `writing-${taskType}` && r.level === lvl)) {
          results.push({ type: `writing-${taskType}`, level: lvl, existing, created })
        }
      }
    }
  }

  // --- SPEAKING TOPICS ---
  if (!type || type === 'speaking') {
    for (const lvl of levels) {
      const existing = await prisma.speakingTopic.count({
        where: { level: lvl },
      })

      const toCreate = Math.max(0, targetCount - existing)
      if (toCreate === 0) {
        results.push({ type: 'speaking', level: lvl, existing, created: 0 })
        continue
      }

      const existingTopicsDb = await prisma.speakingTopic.findMany({
        where: { level: lvl },
        select: { topic: true },
        take: 50,
      })
      const existingTopics = existingTopicsDb.map((t) => t.topic.slice(0, 60))

      let created = 0
      let batchesNeeded = Math.ceil(toCreate / BATCH_SIZE)

      for (let b = 0; b < batchesNeeded; b++) {
        const batchCount = Math.min(BATCH_SIZE, toCreate - created)
        try {
          const topics = await generateSpeakingTopicsBatch(lvl, batchCount, existingTopics)

          for (const topic of topics) {
            if (created >= toCreate) break
            await prisma.speakingTopic.create({
              data: { level: lvl, topic, category: 'general' },
            })
            existingTopics.push(topic.slice(0, 60))
            created++
          }
        } catch (err: any) {
          results.push({ type: 'speaking', level: lvl, existing, created, error: err?.message })
          break
        }
      }

      if (!results.find((r) => r.type === 'speaking' && r.level === lvl)) {
        results.push({ type: 'speaking', level: lvl, existing, created })
      }
    }
  }

  // --- LISTENING CONTENT ---
  if (!type || type === 'listening') {
    for (const lvl of levels) {
      for (const lang of LANGUAGES) {
        const existing = await prisma.listeningContent.count({
          where: { level: lvl, language: lang },
        })

        const toCreate = Math.max(0, targetCount - existing)
        if (toCreate === 0) {
          results.push({ type: 'listening', level: lvl, language: lang, existing, created: 0 })
          continue
        }

        let created = 0
        for (let i = 0; i < toCreate; i++) {
          try {
            const content = await generateListeningContent(lvl, lang)
            await prisma.listeningContent.create({
              data: {
                level: lvl,
                language: lang,
                passage: content.passage,
                questions: JSON.stringify(content.questions),
                topic: 'general',
              },
            })
            created++
          } catch (err: any) {
            results.push({ type: 'listening', level: lvl, language: lang, existing, created, error: err?.message })
            break
          }
        }

        if (!results.find((r) => r.type === 'listening' && r.level === lvl && r.language === lang)) {
          results.push({ type: 'listening', level: lvl, language: lang, existing, created })
        }
      }
    }
  }

  return NextResponse.json({ results, total: results.reduce((s, r) => s + r.created, 0) })
}
