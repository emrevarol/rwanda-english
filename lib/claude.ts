import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const MODEL = 'claude-haiku-4-5-20251001'

const LANG_NAMES: Record<string, string> = {
  en: 'English',
  tr: 'Turkish',
  rw: 'Kinyarwanda',
  zh: 'Chinese',
  es: 'Spanish',
  pt: 'Portuguese',
  ja: 'Japanese',
  ko: 'Korean',
  id: 'Indonesian',
  ar: 'Arabic',
  hi: 'Hindi',
  vi: 'Vietnamese',
  th: 'Thai',
  de: 'German',
  fr: 'French',
  it: 'Italian',
  ru: 'Russian',
  pl: 'Polish',
}

export function getCEFRSystemPrompt(level: string, language: string): string {
  const levelDescriptions: Record<string, string> = {
    A1: 'Use very simple vocabulary, very short sentences (5-8 words), basic present tense only, common everyday words, fill-in-the-blank exercises.',
    A2: 'Use simple vocabulary, short sentences (8-12 words), basic past and present tense, familiar topics like family, food, daily routines.',
    B1: 'Use intermediate vocabulary, medium-length sentences (12-20 words), various tenses, topics like travel, education, work, simple opinions.',
    B2: 'Use upper-intermediate vocabulary, complex sentences, various grammatical structures, abstract topics, argument and persuasion.',
    C1: 'Use advanced vocabulary, complex academic texts, sophisticated grammatical structures, nuanced arguments, idiomatic expressions.',
    C2: 'Use proficiency-level vocabulary, highly complex academic texts, rhetorical devices, debate topics, professional and academic discourse.',
  }

  const langName = LANG_NAMES[language] || 'English'
  const langInstruction = language !== 'en'
    ? `IMPORTANT: Write ALL your feedback, explanations, and responses in ${langName}. The student's interface language is ${langName}, so they expect feedback in ${langName}. Only keep English examples, vocabulary words, and grammar terms in English — everything else must be in ${langName}.`
    : 'Write all feedback and explanations in English.'

  return `You are an expert English language teacher. The student's CEFR level is ${level}.
Adapt your language complexity accordingly: ${levelDescriptions[level] || levelDescriptions['B1']}
${langInstruction}
Always be encouraging, clear, and specific in your feedback.`
}

export async function analyzeWriting(
  text: string,
  prompt: string,
  taskType: string,
  level: string,
  language: string
) {
  const systemPrompt = getCEFRSystemPrompt(level, language)

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `You are grading a ${taskType} writing task.

Writing prompt given to the student:
"${prompt}"

Student's response:
"${text}"

Please provide a JSON response with the following structure:
{
  "band": <number 1-9>,
  "taskAchievement": "<feedback string>",
  "coherence": "<feedback string>",
  "vocabulary": "<feedback string>",
  "vocabularyScore": <number 1-9, score for lexical resource>,
  "grammar": "<feedback string>",
  "grammarScore": <number 1-9, score for grammatical range and accuracy>,
  "improvedSentences": ["<improved version of a weak sentence>", "<another improved sentence>"],
  "overallFeedback": "<2-3 sentence overall comment>"
}

IMPORTANT: All feedback text values must be written in ${LANG_NAMES[language] || 'English'}. Keep JSON keys in English. The "improvedSentences" should show the corrected English sentences, but any explanatory text should be in ${LANG_NAMES[language] || 'English'}.
Only return valid JSON, nothing else.`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')
    return JSON.parse(jsonMatch[0])
  } catch {
    return {
      band: 5,
      taskAchievement: content.text,
      coherence: 'See above feedback',
      vocabulary: 'See above feedback',
      grammar: 'See above feedback',
      improvedSentences: [],
      overallFeedback: content.text,
    }
  }
}

export async function analyzeSpeaking(
  transcript: string,
  topic: string,
  level: string,
  language: string
) {
  const systemPrompt = getCEFRSystemPrompt(level, language)

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1200,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Analyze this spoken English response from a student learning English.

Speaking topic: "${topic}"

Transcript of what was said:
"${transcript}"

Provide a JSON response:
{
  "score": <number 1-10>,
  "fluency": "<feedback on fluency and pronunciation patterns>",
  "grammar": "<specific grammar issues found>",
  "vocabulary": "<vocabulary suggestions and improvements>",
  "modelAnswer": "<a model answer at ${level} level for this topic>",
  "overallFeedback": "<encouraging overall comment>"
}

IMPORTANT: All feedback text values must be written in ${LANG_NAMES[language] || 'English'}. The "modelAnswer" should be in English (since they're learning English), but all explanatory feedback must be in ${LANG_NAMES[language] || 'English'}.
Only return valid JSON, nothing else.`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')
    return JSON.parse(jsonMatch[0])
  } catch {
    return {
      score: 5,
      fluency: content.text,
      grammar: 'See above',
      vocabulary: 'See above',
      modelAnswer: '',
      overallFeedback: content.text,
    }
  }
}

export async function generateListeningContent(level: string, language: string, topic: string = 'general') {
  const systemPrompt = getCEFRSystemPrompt(level, language)

  const topicGuide: Record<string, string> = {
    general: 'an educational or everyday topic',
    business: 'a business, workplace, or corporate topic (meetings, negotiations, office life)',
    technology: 'a technology topic (AI, apps, startups, digital trends)',
    travel: 'a travel or tourism topic (destinations, airports, cultural experiences)',
    science: 'a science or nature topic (discoveries, environment, health research)',
    culture: 'a culture, arts, or entertainment topic (music, cinema, traditions)',
    health: 'a health, fitness, or wellness topic (nutrition, exercise, mental health)',
    education: 'an education topic (university life, studying abroad, online learning)',
  }
  const topicDesc = topicGuide[topic] || topicGuide.general

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Generate a listening comprehension exercise for a ${level} English learner.

Return a JSON object:
{
  "passage": "<a reading passage of 100-200 words appropriate for ${level} level, about ${topicDesc}. The passage MUST be in English since this is an English learning exercise>",
  "questions": [
    {
      "question": "<comprehension question>",
      "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
      "correct": <0-3 index of correct answer>,
      "explanation": "<why this answer is correct>"
    }
  ]
}

IMPORTANT: The "passage" must be in English (it's an English listening exercise). The "question" text, "options", and "explanation" must all be in ${LANG_NAMES[language] || 'English'} so the student can understand them in their preferred language.
Include 4 questions. Only return valid JSON, nothing else.`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON in listening response')
  return JSON.parse(jsonMatch[0])
}

export async function gradeAssessment(
  questions: Array<{ question: string; userAnswer: string; correctAnswer?: string }>,
  level: string,
  language: string = 'en'
) {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 800,
    messages: [
      {
        role: 'user',
        content: `You are an English placement test grader. Evaluate these answers and determine the student's CEFR level.

Questions and answers:
${questions.map((q, i) => `${i + 1}. Q: ${q.question}\n   A: ${q.userAnswer}`).join('\n\n')}

Based on the quality of these answers (vocabulary, grammar, comprehension), determine the CEFR level.

Return JSON:
{
  "level": "<A1|A2|B1|B2|C1|C2>",
  "score": <percentage 0-100>,
  "feedback": "<brief explanation of why this level was assigned>"
}

IMPORTANT: The "feedback" text must be written in ${LANG_NAMES[language] || 'English'}.
Only return valid JSON, nothing else.`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON in assessment response')
  return JSON.parse(jsonMatch[0])
}

// --- Bulk content generation for seeding pools ---

const LEVEL_WORD_COUNTS: Record<string, { task1: string; task2: string }> = {
  A1: { task1: '40-60 words, 3-5 simple sentences', task2: '40-60 words, 5-8 simple sentences' },
  A2: { task1: '50-80 words, short paragraph', task2: '80-120 words, 1-2 paragraphs' },
  B1: { task1: '150+ words with intro and conclusion', task2: '150+ words essay with intro, 2-3 body paragraphs, conclusion' },
  B2: { task1: '200+ words analyzing data', task2: '200+ words balanced essay' },
  C1: { task1: '250+ words with academic language', task2: '250+ words academic essay' },
  C2: { task1: '300+ words with critical analysis', task2: '300+ words scholarly essay' },
}

const WRITING_CATEGORIES = [
  'education', 'technology', 'health', 'environment', 'work',
  'travel', 'culture', 'science', 'economics', 'sports',
  'media', 'food', 'family', 'cities', 'transportation',
  'arts', 'history', 'social issues', 'communication', 'hobbies',
]

export async function generateWritingPromptsBatch(
  level: string,
  taskType: string,
  count: number,
  existingTopics: string[] = []
): Promise<string[]> {
  const wc = LEVEL_WORD_COUNTS[level] || LEVEL_WORD_COUNTS['B1']
  const wordReq = taskType === 'task1' ? wc.task1 : wc.task2
  const taskDesc = taskType === 'task1'
    ? 'data/chart description tasks (the student will describe a chart, table, or graph)'
    : 'essay/opinion writing tasks'

  const avoidList = existingTopics.length > 0
    ? `\nAVOID these topics that already exist: ${existingTopics.slice(-50).join(', ')}`
    : ''

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `Generate exactly ${count} unique English writing prompts for ${taskDesc} at CEFR ${level} level.

Requirements per prompt:
- Word requirement: ${wordReq}
- Each prompt must be about a DIFFERENT topic/subject
- Cover diverse categories: education, technology, health, environment, work, travel, culture, science, economics, sports, media, food, family, cities, etc.
- For task1: include a reference to "the chart/table/graph below" so the student knows to describe data
- For task2: include clear instructions on structure (intro, body, conclusion)
- Make prompts engaging and relevant to real-world topics
${avoidList}

Return a JSON array of strings, each string is one complete prompt:
["prompt 1 text...", "prompt 2 text...", ...]

Only return valid JSON array, nothing else.`,
    }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  const jsonMatch = content.text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('No JSON array found')
  return JSON.parse(jsonMatch[0])
}

const SPEAKING_CATEGORIES = [
  'personal experience', 'opinion', 'comparison', 'problem-solving',
  'future plans', 'past events', 'hypothetical', 'description',
  'narrative', 'debate', 'analysis', 'recommendation',
]

export async function generateSpeakingTopicsBatch(
  level: string,
  count: number,
  existingTopics: string[] = []
): Promise<string[]> {
  const avoidList = existingTopics.length > 0
    ? `\nAVOID these topics that already exist: ${existingTopics.slice(-50).join(', ')}`
    : ''

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `Generate exactly ${count} unique English speaking practice topics/questions for CEFR ${level} level students.

Requirements:
- Each topic should be a clear question or instruction for the student to speak about
- Cover diverse categories: personal experience, opinions, comparisons, problem-solving, future plans, hypothetical scenarios, descriptions, debates, analysis, etc.
- Adapt complexity to ${level} level (A1=very simple, C2=highly sophisticated)
- Topics should encourage 1-3 minutes of speaking
- Make topics engaging, thought-provoking, and relevant to real life
${avoidList}

Return a JSON array of strings:
["topic 1...", "topic 2...", ...]

Only return valid JSON array, nothing else.`,
    }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  const jsonMatch = content.text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('No JSON array found')
  return JSON.parse(jsonMatch[0])
}

