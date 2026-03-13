import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { anthropic, MODEL, getCEFRSystemPrompt } from '@/lib/claude'
import { prisma } from '@/lib/db'
import { hasActiveAccess } from '@/lib/stripe'
import { isMockMode } from '@/lib/mock'

const mockWords = [
  { word: 'significant', definition: 'important or large enough to have an effect', example: 'The weather had a significant impact on the harvest.', category: 'general' },
  { word: 'demonstrate', definition: 'to show or prove something clearly', example: 'The experiment will demonstrate how plants grow.', category: 'general' },
  { word: 'consequence', definition: 'a result or effect of an action', example: 'Pollution has serious consequences for the environment.', category: 'general' },
  { word: 'perspective', definition: 'a particular way of thinking about something', example: 'Travel gives you a new perspective on life.', category: 'general' },
  { word: 'elaborate', definition: 'to explain in more detail', example: 'Could you elaborate on your proposal?', category: 'general' },
  { word: 'substantial', definition: 'large in size, value, or importance', example: 'They made a substantial profit this year.', category: 'general' },
  { word: 'contribute', definition: 'to give something to help achieve a goal', example: 'Everyone should contribute to the discussion.', category: 'general' },
  { word: 'inevitable', definition: 'certain to happen and impossible to avoid', example: 'Change is inevitable in any organization.', category: 'general' },
  { word: 'distinguish', definition: 'to recognize or treat as different', example: 'It is important to distinguish between fact and opinion.', category: 'general' },
  { word: 'comprehensive', definition: 'including all or nearly all elements', example: 'The report provides a comprehensive analysis of the data.', category: 'general' },
]

const POOL_MIN = 10 // minimum pool size before we generate more

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await hasActiveAccess(session.user.id))) {
      return NextResponse.json({ error: 'Subscription required', code: 'SUBSCRIPTION_REQUIRED' }, { status: 403 })
    }

    const category = req.nextUrl.searchParams.get('category') || 'general'

    if (isMockMode()) {
      return NextResponse.json({ words: mockWords })
    }

    const level = session.user.level || 'B1'

    // Try to serve from pool — pick 10 random words with least usage
    const poolCount = await prisma.vocabularyWord.count({
      where: { level, category },
    })

    if (poolCount >= POOL_MIN) {
      // Get 10 random words: order by usedCount (least used first), add some randomness
      const poolWords = await prisma.vocabularyWord.findMany({
        where: { level, category },
        orderBy: { usedCount: 'asc' },
        take: 30, // grab more than needed for randomness
      })

      // Shuffle and pick 10
      const shuffled = poolWords.sort(() => Math.random() - 0.5).slice(0, 10)

      // Increment usage counts
      await prisma.vocabularyWord.updateMany({
        where: { id: { in: shuffled.map(w => w.id) } },
        data: { usedCount: { increment: 1 } },
      })

      return NextResponse.json({
        words: shuffled.map(w => ({
          word: w.word,
          definition: w.definition,
          example: w.example,
          category: w.category,
        })),
        source: 'pool',
      })
    }

    // Pool too small — generate via AI and save to pool
    const language = session.user.language
    const systemPrompt = getCEFRSystemPrompt(level, language)

    const categoryDescriptions: Record<string, string> = {
      general: 'common everyday and academic words',
      academic: 'academic and formal vocabulary used in essays and research',
      business: 'business, corporate, and professional vocabulary',
      idioms: 'English idioms and figurative expressions',
      phrasal: 'phrasal verbs (verb + preposition combinations)',
      travel: 'travel, tourism, and cultural exchange vocabulary',
    }

    // Request more words to build the pool faster
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Generate 20 English vocabulary words for a ${level} level learner.

Category: ${categoryDescriptions[category] || 'general vocabulary'}

Return a JSON array of objects:
[
  {
    "word": "<the English word or phrase>",
    "definition": "<clear definition in simple English>",
    "example": "<natural example sentence using the word>",
    "category": "${category}"
  }
]

Requirements:
- Words must be appropriate for ${level} CEFR level
- Each word must have a clear, concise definition
- Example sentences should be natural and demonstrate the word's meaning
- Include a mix of nouns, verbs, adjectives, and adverbs where appropriate
- For phrasal verbs category, include the phrasal verb as the "word"
- For idioms, include the full idiom as the "word"
- Avoid very basic words (the, is, go) and overly rare words
- Make sure all 20 words are DIFFERENT from each other

Only return valid JSON array, nothing else.`,
      }],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type')

    const jsonMatch = content.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON array found')
    const words = JSON.parse(jsonMatch[0]) as Array<{ word: string; definition: string; example: string; category: string }>

    // Save all to pool (skip duplicates via upsert)
    for (const w of words) {
      try {
        await prisma.vocabularyWord.upsert({
          where: {
            word_level_category: { word: w.word.toLowerCase(), level, category },
          },
          update: {}, // don't overwrite existing
          create: {
            word: w.word.toLowerCase(),
            definition: w.definition,
            example: w.example,
            level,
            category,
            usedCount: 0,
          },
        })
      } catch {
        // Skip duplicates silently
      }
    }

    // Return first 10 to the user
    const result = words.slice(0, 10)

    // Mark returned ones as used
    await prisma.vocabularyWord.updateMany({
      where: {
        word: { in: result.map(w => w.word.toLowerCase()) },
        level,
        category,
      },
      data: { usedCount: { increment: 1 } },
    })

    return NextResponse.json({ words: result, source: 'generated' })
  } catch (error: unknown) {
    console.error('Vocabulary generate error:', error)
    const errMsg = error instanceof Error ? error.message : String(error)
    if (errMsg.includes('credit balance')) {
      return NextResponse.json({ error: 'AI service temporarily unavailable. Please try again later.', code: 'API_CREDITS' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Failed to generate vocabulary' }, { status: 500 })
  }
}
