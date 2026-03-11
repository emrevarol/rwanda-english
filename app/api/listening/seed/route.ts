import { NextRequest, NextResponse } from 'next/server'
import { generateListeningContent } from '@/lib/claude'
import { prisma } from '@/lib/db'
import { isMockMode } from '@/lib/mock'

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const LANGUAGES = ['en', 'rw', 'tr']
const ITEMS_PER_COMBO = 5

export async function POST(req: NextRequest) {
  // Simple auth check — use a secret key
  const { secret, level, language, count } = await req.json()

  if (secret !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (isMockMode()) {
    return NextResponse.json({ error: 'Cannot seed in mock mode' }, { status: 400 })
  }

  const levels = level ? [level] : LEVELS
  const languages = language ? [language] : LANGUAGES
  const itemCount = count || ITEMS_PER_COMBO

  const results: Array<{ level: string; language: string; created: number; error?: string }> = []

  for (const lvl of levels) {
    for (const lang of languages) {
      // Check how many we already have
      const existing = await prisma.listeningContent.count({
        where: { level: lvl, language: lang },
      })

      const toCreate = Math.max(0, itemCount - existing)
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
          results.push({ level: lvl, language: lang, created, error: err?.message })
          break
        }
      }

      results.push({ level: lvl, language: lang, created })
    }
  }

  return NextResponse.json({ results })
}
