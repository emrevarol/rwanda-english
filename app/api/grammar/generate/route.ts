import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { anthropic, MODEL, getCEFRSystemPrompt } from '@/lib/claude'
import { hasActiveAccess } from '@/lib/stripe'
import { isMockMode } from '@/lib/mock'

const EXERCISE_TYPES = ['fill-blank', 'error-correction', 'multiple-choice', 'sentence-reorder'] as const

const TOPIC_DESCRIPTIONS: Record<string, string> = {
  general: 'mixed grammar topics',
  tenses: 'verb tenses (present simple, past simple, present perfect, past perfect, future forms, continuous forms)',
  articles: 'articles and determiners (a, an, the, some, any, much, many, few, little)',
  prepositions: 'prepositions of time, place, and movement (in, on, at, to, from, by, with, etc.)',
  conditionals: 'conditional sentences (zero, first, second, third conditionals, mixed conditionals)',
  passive: 'passive voice constructions across different tenses',
  relative: 'relative clauses (who, which, that, whose, where, when)',
  modals: 'modal verbs (can, could, may, might, must, shall, should, will, would, ought to)',
  reported: 'reported/indirect speech (tense shifts, pronoun changes, time expressions)',
}

const mockExercise = {
  questions: [
    {
      type: 'fill-blank',
      sentence: 'She ___ (go) to school every day.',
      answer: 'goes',
      options: ['go', 'goes', 'going', 'went'],
      explanation: 'Present simple: third person singular adds -s. She goes.',
    },
    {
      type: 'error-correction',
      sentence: 'He have been waiting for two hours.',
      corrected: 'He has been waiting for two hours.',
      explanation: 'Third person singular uses "has" not "have" with present perfect continuous.',
    },
    {
      type: 'multiple-choice',
      sentence: 'If I ___ rich, I would travel the world.',
      answer: 'were',
      options: ['am', 'was', 'were', 'be'],
      explanation: 'Second conditional uses "were" for all subjects (If I were, If he were).',
    },
    {
      type: 'fill-blank',
      sentence: 'They have lived here ___ 2010.',
      answer: 'since',
      options: ['for', 'since', 'from', 'during'],
      explanation: '"Since" is used with a specific point in time. "For" is used with a duration.',
    },
    {
      type: 'multiple-choice',
      sentence: 'The report ___ by the manager yesterday.',
      answer: 'was approved',
      options: ['approved', 'was approved', 'has approved', 'is approved'],
      explanation: 'Past simple passive: was/were + past participle.',
    },
  ],
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await hasActiveAccess(session.user.id))) {
      return NextResponse.json({ error: 'Subscription required', code: 'SUBSCRIPTION_REQUIRED' }, { status: 403 })
    }

    const topic = req.nextUrl.searchParams.get('topic') || 'general'

    if (isMockMode()) {
      return NextResponse.json(mockExercise)
    }

    const level = session.user.level || 'B1'
    const language = session.user.language || 'en'
    const systemPrompt = getCEFRSystemPrompt(level, language)
    const topicDesc = TOPIC_DESCRIPTIONS[topic] || TOPIC_DESCRIPTIONS.general

    const exerciseTypes = EXERCISE_TYPES.join(', ')

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Generate 8 grammar exercise questions for a ${level} level English learner.

Topic: ${topicDesc}

Create a MIX of these exercise types: ${exerciseTypes}

Return a JSON object:
{
  "questions": [
    {
      "type": "fill-blank",
      "sentence": "She ___ (go) to school every day.",
      "answer": "goes",
      "options": ["go", "goes", "going", "went"],
      "explanation": "Present simple third person singular adds -s."
    },
    {
      "type": "error-correction",
      "sentence": "He have been waiting for two hours.",
      "corrected": "He has been waiting for two hours.",
      "explanation": "Third person singular uses 'has' not 'have'."
    },
    {
      "type": "multiple-choice",
      "sentence": "If I ___ rich, I would travel the world.",
      "answer": "were",
      "options": ["am", "was", "were", "be"],
      "explanation": "Second conditional uses 'were' for all subjects."
    },
    {
      "type": "sentence-reorder",
      "words": ["been", "has", "she", "studying", "morning", "since"],
      "answer": "She has been studying since morning.",
      "explanation": "Present perfect continuous: subject + has/have + been + verb-ing."
    }
  ]
}

Requirements:
- Questions appropriate for ${level} CEFR level
- Mix of at least 3 different exercise types
- For fill-blank and multiple-choice: provide exactly 4 options
- For error-correction: provide the wrong sentence and the corrected version
- For sentence-reorder: provide scrambled words and the correct sentence
- Clear, concise explanations for each answer
- All explanations in English

Only return valid JSON, nothing else.`,
      }],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type')

    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')
    const data = JSON.parse(jsonMatch[0])

    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Grammar generate error:', error)
    const errMsg = error instanceof Error ? error.message : String(error)
    if (errMsg.includes('credit balance')) {
      return NextResponse.json({ error: 'AI service temporarily unavailable.', code: 'API_CREDITS' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Failed to generate exercise' }, { status: 500 })
  }
}
