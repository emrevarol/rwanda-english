/**
 * Import ALL hand-curated vocabulary into the database.
 * Replaces Haiku-generated content with human-quality data.
 * Usage: npx tsx scripts/seed-curated-vocab.ts
 */

import { PrismaClient } from '@prisma/client'
import { A1_GENERAL, A1_TRAVEL, A1_BUSINESS, A1_PHRASAL, A1_IDIOMS, A1_ACADEMIC } from './seed-data/vocab-a1'
import { A2_GENERAL, A2_BUSINESS, A2_TRAVEL, A2_IDIOMS, A2_PHRASAL, A2_ACADEMIC } from './seed-data/vocab-a2'
import { B1_GENERAL, B1_BUSINESS, B1_TRAVEL, B1_IDIOMS, B1_PHRASAL, B1_ACADEMIC, B2_GENERAL, C1_GENERAL, C2_GENERAL } from './seed-data/vocab-b1-c2'
import { B2_BUSINESS, B2_IDIOMS, B2_PHRASAL, B2_TRAVEL, B2_ACADEMIC } from './seed-data/vocab-b2'
import {
  C1_BUSINESS, C1_IDIOMS, C1_PHRASAL, C1_TRAVEL, C1_ACADEMIC,
  C2_BUSINESS, C2_IDIOMS, C2_PHRASAL, C2_TRAVEL, C2_ACADEMIC,
} from './seed-data/vocab-c1c2'
import { A1_SPORTS, A2_SPORTS, B1_SPORTS, B2_SPORTS, C1_SPORTS, C2_SPORTS } from './seed-data/vocab-sports'
import { A1_FOOD, A2_FOOD, B1_FOOD, B2_FOOD, C1_FOOD, C2_FOOD } from './seed-data/vocab-food'

const prisma = new PrismaClient()

type WordData = { word: string; definition: string; example: string }

async function upsertWords(words: WordData[], level: string, category: string) {
  let created = 0, updated = 0
  for (const w of words) {
    const wordLower = w.word.toLowerCase()
    try {
      const existing = await prisma.vocabularyWord.findUnique({
        where: { word_level_category: { word: wordLower, level, category } },
      })
      if (existing) {
        await prisma.vocabularyWord.update({
          where: { id: existing.id },
          data: { definition: w.definition, example: w.example },
        })
        updated++
      } else {
        await prisma.vocabularyWord.create({
          data: { word: wordLower, definition: w.definition, example: w.example, level, category, usedCount: 0 },
        })
        created++
      }
    } catch { /* skip */ }
  }
  return { created, updated }
}

async function main() {
  console.log('=== IMPORTING ALL CURATED VOCABULARY ===\n')

  // Clear A1 and A2 completely (replace with curated)
  for (const level of ['A1', 'A2']) {
    for (const cat of ['general', 'travel', 'business', 'phrasal', 'idioms', 'academic', 'sports', 'food']) {
      const del = await prisma.vocabularyWord.deleteMany({ where: { level, category: cat } })
      if (del.count > 0) console.log(`  Cleared ${level}/${cat}: ${del.count}`)
    }
  }

  // For B1-C2: clear and replace categories where we have curated data
  const clearTargets = [
    ['B1', 'general'], ['B1', 'business'], ['B1', 'travel'], ['B1', 'idioms'], ['B1', 'phrasal'], ['B1', 'academic'],
    ['B2', 'general'], ['B2', 'business'], ['B2', 'idioms'], ['B2', 'phrasal'], ['B2', 'travel'], ['B2', 'academic'],
    ['C1', 'general'], ['C1', 'business'], ['C1', 'idioms'], ['C1', 'phrasal'], ['C1', 'travel'], ['C1', 'academic'],
    ['C2', 'general'], ['C2', 'business'], ['C2', 'idioms'], ['C2', 'phrasal'], ['C2', 'travel'], ['C2', 'academic'],
    // Sports & Food (all levels)
    ['B1', 'sports'], ['B1', 'food'],
    ['B2', 'sports'], ['B2', 'food'],
    ['C1', 'sports'], ['C1', 'food'],
    ['C2', 'sports'], ['C2', 'food'],
  ]
  for (const [level, cat] of clearTargets) {
    const del = await prisma.vocabularyWord.deleteMany({ where: { level, category: cat } })
    if (del.count > 0) console.log(`  Cleared ${level}/${cat}: ${del.count}`)
  }

  const imports: Array<[WordData[], string, string]> = [
    // A1 (fully curated)
    [A1_GENERAL, 'A1', 'general'],
    [A1_TRAVEL, 'A1', 'travel'],
    [A1_BUSINESS, 'A1', 'business'],
    [A1_PHRASAL, 'A1', 'phrasal'],
    [A1_IDIOMS, 'A1', 'idioms'],
    [A1_ACADEMIC, 'A1', 'academic'],
    // A2 (fully curated)
    [A2_GENERAL, 'A2', 'general'],
    [A2_BUSINESS, 'A2', 'business'],
    [A2_TRAVEL, 'A2', 'travel'],
    [A2_IDIOMS, 'A2', 'idioms'],
    [A2_PHRASAL, 'A2', 'phrasal'],
    [A2_ACADEMIC, 'A2', 'academic'],
    // B1 (fully curated)
    [B1_GENERAL, 'B1', 'general'],
    [B1_BUSINESS, 'B1', 'business'],
    [B1_TRAVEL, 'B1', 'travel'],
    [B1_IDIOMS, 'B1', 'idioms'],
    [B1_PHRASAL, 'B1', 'phrasal'],
    [B1_ACADEMIC, 'B1', 'academic'],
    // B2 (fully curated for missing cats, supplement general)
    [B2_GENERAL, 'B2', 'general'],
    [B2_BUSINESS, 'B2', 'business'],
    [B2_IDIOMS, 'B2', 'idioms'],
    [B2_PHRASAL, 'B2', 'phrasal'],
    [B2_TRAVEL, 'B2', 'travel'],
    [B2_ACADEMIC, 'B2', 'academic'],
    // C1
    [C1_GENERAL, 'C1', 'general'],
    [C1_BUSINESS, 'C1', 'business'],
    [C1_IDIOMS, 'C1', 'idioms'],
    [C1_PHRASAL, 'C1', 'phrasal'],
    [C1_TRAVEL, 'C1', 'travel'],
    [C1_ACADEMIC, 'C1', 'academic'],
    // C2
    [C2_GENERAL, 'C2', 'general'],
    [C2_BUSINESS, 'C2', 'business'],
    [C2_IDIOMS, 'C2', 'idioms'],
    [C2_PHRASAL, 'C2', 'phrasal'],
    [C2_TRAVEL, 'C2', 'travel'],
    [C2_ACADEMIC, 'C2', 'academic'],
    // Sports (A1-C2)
    [A1_SPORTS, 'A1', 'sports'],
    [A2_SPORTS, 'A2', 'sports'],
    [B1_SPORTS, 'B1', 'sports'],
    [B2_SPORTS, 'B2', 'sports'],
    [C1_SPORTS, 'C1', 'sports'],
    [C2_SPORTS, 'C2', 'sports'],
    // Food (A1-C2)
    [A1_FOOD, 'A1', 'food'],
    [A2_FOOD, 'A2', 'food'],
    [B1_FOOD, 'B1', 'food'],
    [B2_FOOD, 'B2', 'food'],
    [C1_FOOD, 'C1', 'food'],
    [C2_FOOD, 'C2', 'food'],
  ]

  for (const [words, level, category] of imports) {
    const { created, updated } = await upsertWords(words, level, category)
    console.log(`  ${level}/${category}: +${created} new, ~${updated} updated (${words.length} curated)`)
  }

  // Final counts
  console.log('\n=== FINAL COUNTS ===')
  const byLevel = await prisma.vocabularyWord.groupBy({
    by: ['level', 'category'],
    _count: true,
    orderBy: [{ level: 'asc' }, { category: 'asc' }],
  })
  let total = 0, currentLevel = ''
  for (const r of byLevel) {
    if (r.level !== currentLevel) { currentLevel = r.level; console.log(`\n  ${r.level}:`) }
    console.log(`    ${r.category}: ${r._count}`)
    total += r._count
  }
  console.log(`\n  TOTAL: ${total}`)
  await prisma.$disconnect()
}

main().catch(console.error)
