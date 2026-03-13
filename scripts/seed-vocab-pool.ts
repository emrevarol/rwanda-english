/**
 * Seed vocabulary word pool into the database.
 * Usage: npx tsx scripts/seed-vocab-pool.ts
 * Target: 200 words per level+category (7200 total)
 */

import Anthropic from '@anthropic-ai/sdk'
import { PrismaClient } from '@prisma/client'

const anthropic = new Anthropic()
const MODEL = 'claude-haiku-4-5-20251001'

const TARGET_PER_COMBO = 200
const BATCH_SIZE = 25

const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const categories = ['general', 'academic', 'business', 'idioms', 'phrasal', 'travel']

const categoryDescriptions: Record<string, string> = {
  general: 'common everyday and academic words',
  academic: 'academic and formal vocabulary used in essays and research',
  business: 'business, corporate, and professional vocabulary',
  idioms: 'English idioms and figurative expressions',
  phrasal: 'phrasal verbs (verb + preposition combinations)',
  travel: 'travel, tourism, and cultural exchange vocabulary',
}

async function generateWords(level: string, category: string, existingWords: string[]): Promise<Array<{ word: string; definition: string; example: string }>> {
  const avoidList = existingWords.length > 0
    ? `\n\nDo NOT include any of these words: ${existingWords.slice(-100).join(', ')}`
    : ''

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 5000,
    messages: [{
      role: 'user',
      content: `Generate ${BATCH_SIZE} English vocabulary words for a ${level} CEFR level learner.
Category: ${categoryDescriptions[category]}

Return a JSON array: [{"word":"...","definition":"...","example":"..."}]

Requirements:
- Appropriate for ${level} CEFR level
- Clear definitions, natural example sentences
- Mix of nouns, verbs, adjectives, adverbs
- All ${BATCH_SIZE} words must be unique${avoidList}

Only return valid JSON array.`,
    }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')
  const jsonMatch = content.text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('No JSON array found')
  return JSON.parse(jsonMatch[0])
}

async function main() {
  let totalCreated = 0

  for (const level of levels) {
    for (const category of categories) {
      // Fresh connection per combo to avoid pool exhaustion
      const prisma = new PrismaClient()

      try {
        const existingWords = (await prisma.vocabularyWord.findMany({
          where: { level, category },
          select: { word: true },
        })).map(w => w.word)

        const needed = TARGET_PER_COMBO - existingWords.length
        if (needed <= 0) {
          console.log(`  SKIP ${level}/${category} — ${existingWords.length} words`)
          await prisma.$disconnect()
          continue
        }

        console.log(`  ${level}/${category} — has ${existingWords.length}, need ${needed}`)
        let allKnown = [...existingWords]
        let created = 0
        const batches = Math.ceil(needed / BATCH_SIZE)

        for (let b = 0; b < batches; b++) {
          try {
            const words = await generateWords(level, category, allKnown)
            for (const w of words) {
              const wordLower = w.word.toLowerCase()
              if (allKnown.includes(wordLower)) continue
              try {
                await prisma.vocabularyWord.create({
                  data: { word: wordLower, definition: w.definition, example: w.example, level, category, usedCount: 0 },
                })
                allKnown.push(wordLower)
                created++
              } catch { /* duplicate */ }
            }
            console.log(`    batch ${b + 1}/${batches} — ${created} new`)
          } catch (err: any) {
            console.error(`    batch ${b + 1} error: ${err.message}`)
          }
          await new Promise(r => setTimeout(r, 500))
        }

        totalCreated += created
        console.log(`  ✓ ${level}/${category} — +${created} (total: ${existingWords.length + created})`)
      } finally {
        await prisma.$disconnect()
      }

      // Extra pause between combos
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  const prisma = new PrismaClient()
  const finalCount = await prisma.vocabularyWord.count()
  console.log(`\nDone! New: ${totalCreated}, Total: ${finalCount}`)
  await prisma.$disconnect()
}

main().catch(console.error)
