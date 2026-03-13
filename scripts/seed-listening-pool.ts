/**
 * Seed listening content pool into the database.
 * Usage: npx tsx scripts/seed-listening-pool.ts
 * Target: 10 passages per level+language+topic for main langs, 5 for others
 */

import Anthropic from '@anthropic-ai/sdk'
import { PrismaClient } from '@prisma/client'

const anthropic = new Anthropic()
const MODEL = 'claude-haiku-4-5-20251001'

const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const topics = ['general', 'business', 'technology', 'travel', 'science', 'culture', 'health', 'education']
const mainLanguages = ['en', 'tr', 'rw']
const otherLanguages = ['fr', 'es', 'de', 'ar', 'pt', 'zh', 'ja', 'ko', 'hi']

const MAIN_TARGET = 10
const OTHER_TARGET = 5

const LANG_NAMES: Record<string, string> = {
  en: 'English', tr: 'Turkish', rw: 'Kinyarwanda', zh: 'Chinese',
  es: 'Spanish', pt: 'Portuguese', ja: 'Japanese', ko: 'Korean',
  ar: 'Arabic', hi: 'Hindi', fr: 'French', de: 'German',
}

const topicGuide: Record<string, string> = {
  general: 'an educational or everyday topic',
  business: 'a business or workplace topic',
  technology: 'a technology topic (AI, apps, startups)',
  travel: 'a travel or tourism topic',
  science: 'a science or nature topic',
  culture: 'a culture, arts, or entertainment topic',
  health: 'a health or wellness topic',
  education: 'an education topic',
}

async function generateListening(level: string, language: string, topic: string) {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `Generate a listening comprehension exercise for a ${level} English learner.

Return JSON: {"passage":"<100-200 word English passage about ${topicGuide[topic]}>","questions":[{"question":"...","options":["A","B","C","D"],"correct":<0-3>,"explanation":"..."}]}

Passage MUST be in English. Questions/options/explanations in ${LANG_NAMES[language] || 'English'}.
Include 4 questions. Only valid JSON.`,
    }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response')
  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found')
  return JSON.parse(jsonMatch[0])
}

async function main() {
  let totalCreated = 0
  let totalSkipped = 0
  const allLanguages = [...mainLanguages, ...otherLanguages]

  for (const level of levels) {
    for (const language of allLanguages) {
      const target = mainLanguages.includes(language) ? MAIN_TARGET : OTHER_TARGET

      for (const topic of topics) {
        const prisma = new PrismaClient()
        try {
          const existing = await prisma.listeningContent.count({ where: { level, language, topic } })

          if (existing >= target) {
            totalSkipped++
            await prisma.$disconnect()
            continue
          }

          const needed = target - existing
          console.log(`  ${level}/${language}/${topic} — has ${existing}, need ${needed}`)

          for (let i = 0; i < needed; i++) {
            try {
              const content = await generateListening(level, language, topic)
              await prisma.listeningContent.create({
                data: { level, language, passage: content.passage, questions: JSON.stringify(content.questions), topic, usedCount: 0 },
              })
              totalCreated++
              process.stdout.write(`.`)
            } catch (err: any) {
              console.error(` err:${err.message.slice(0, 40)}`)
            }
            await new Promise(r => setTimeout(r, 400))
          }
          console.log(` ✓`)
        } finally {
          await prisma.$disconnect()
        }
        await new Promise(r => setTimeout(r, 500))
      }
    }
  }

  const prisma = new PrismaClient()
  const finalCount = await prisma.listeningContent.count()
  console.log(`\nDone! New: ${totalCreated}, Skipped: ${totalSkipped}, Total: ${finalCount}`)
  await prisma.$disconnect()
}

main().catch(console.error)
