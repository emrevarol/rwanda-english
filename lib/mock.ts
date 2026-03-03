// Mock responses for testing without an API key

export function isMockMode() {
  const key = process.env.ANTHROPIC_API_KEY || ''
  return !key || key.startsWith('sk-ant-your-key') || key === ''
}

export const mockWritingFeedback = {
  band: 6.5,
  taskAchievement:
    'You have addressed the main points of the task. The response covers the key aspects required, though some points could be developed further with more specific examples.',
  coherence:
    'Your writing has a clear structure with an introduction, body, and conclusion. Use more linking words like "furthermore", "however", and "in contrast" to improve flow.',
  vocabulary:
    'Good range of vocabulary for your level. Try to avoid repeating the same words — use synonyms. Words like "significant", "substantial", and "considerable" can replace "big".',
  grammar:
    'Generally accurate grammar with some minor errors. Watch subject-verb agreement and article usage (a/an/the). Conditional sentences could be used more effectively.',
  improvedSentences: [
    'Original: "Education is very important for children." → Improved: "Education plays a pivotal role in children\'s cognitive and social development."',
    'Original: "Teachers should be good." → Improved: "Effective teachers should demonstrate both subject mastery and strong interpersonal skills."',
  ],
  overallFeedback:
    'This is a solid response at Band 6.5. You demonstrate a good command of English with clear ideas. To reach Band 7+, focus on using more sophisticated vocabulary and complex sentence structures. Keep practicing!',
}

export const mockSpeakingFeedback = {
  score: 7,
  fluency:
    'Your speech flows reasonably well with only minor hesitations. You maintained a good pace throughout. Work on reducing filler words like "um" and "uh" for a more polished delivery.',
  grammar:
    'Good grammatical range. Minor issues with past tense consistency and article usage. Overall, grammar does not impede communication.',
  vocabulary:
    'Appropriate vocabulary for the topic. Consider using more topic-specific terms. For example, instead of "school problems" say "educational challenges" or "pedagogical obstacles".',
  modelAnswer:
    'Teaching in Rwanda presents unique challenges. Teachers must navigate large class sizes while ensuring every student receives adequate attention. Professional development programs and collaborative teaching approaches can significantly enhance educational outcomes.',
  overallFeedback:
    'Great effort! You scored 7/10. Your ideas are clear and well-organized. To improve further, practice speaking on academic topics daily and record yourself to identify areas for improvement.',
}

export const mockListeningContent = {
  passage:
    'Education in Rwanda has undergone significant transformation over the past two decades. The government has invested heavily in building new schools and training teachers across the country. Today, Rwanda boasts one of the highest primary school enrollment rates in sub-Saharan Africa, reaching over 97 percent. English was adopted as the medium of instruction in 2009, replacing French, which has created both opportunities and challenges for teachers and students alike. Teacher professional development programs have been established to help educators improve their English proficiency and adopt modern teaching methods.',
  questions: [
    {
      question: 'What percentage of children are enrolled in primary school in Rwanda?',
      options: ['Over 75%', 'Over 85%', 'Over 97%', 'Over 60%'],
      correct: 2,
      explanation:
        'The passage states Rwanda has "over 97 percent" primary school enrollment rate.',
    },
    {
      question: 'When did Rwanda change its medium of instruction to English?',
      options: ['1994', '2000', '2009', '2015'],
      correct: 2,
      explanation: 'The passage clearly states "English was adopted as the medium of instruction in 2009".',
    },
    {
      question: 'What did English replace as the language of instruction?',
      options: ['Kinyarwanda', 'Swahili', 'Portuguese', 'French'],
      correct: 3,
      explanation: 'The passage says English replaced "French" as the medium of instruction.',
    },
    {
      question: 'What is the main purpose of teacher professional development programs?',
      options: [
        'To teach new subjects',
        'To improve English and modern teaching methods',
        'To increase teacher salaries',
        'To build new schools',
      ],
      correct: 1,
      explanation:
        'The passage states programs were established "to help educators improve their English proficiency and adopt modern teaching methods".',
    },
  ],
}

export const mockAssessmentResult = {
  level: 'B2',
  score: 72,
  feedback:
    'Based on your answers, you demonstrate a solid upper-intermediate level of English (B2). You show good understanding of grammar structures and vocabulary. Your written responses indicate clear thinking and the ability to express complex ideas. Focus on refining your use of academic vocabulary and complex sentence structures to progress toward C1.',
}

export function mockTutorResponse(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('passive')) {
    return "Great question! The **passive voice** is formed with **be + past participle**.\n\nExamples:\n- Active: *The teacher explains the lesson.*\n- Passive: *The lesson is explained by the teacher.*\n\nWe use passive voice when:\n1. The action is more important than who did it\n2. We don't know who did the action\n3. It sounds more formal\n\nWould you like to practice with some exercises?"
  }
  if (lower.includes('since') || lower.includes(' for ')) {
    return '**Since** vs **For** — a common question!\n\n- Use **FOR** with a duration (length of time):\n  - *I have lived here **for** 5 years.*\n  - *She studied **for** 3 hours.*\n\n- Use **SINCE** with a starting point in time:\n  - *I have lived here **since** 2019.*\n  - *She has been a teacher **since** January.*\n\nTip: If you can replace it with "a duration of", use **for**. If you can replace it with "starting from", use **since**.'
  }
  if (lower.includes('vocabulary') || lower.includes('word')) {
    return "Here are some **advanced vocabulary words** useful for academic writing:\n\n| Basic | Advanced |\n|-------|----------|\n| show | demonstrate, illustrate |\n| big | significant, substantial |\n| think | argue, contend, assert |\n| use | utilize, employ |\n| help | facilitate, enhance |\n\nTry to use these in your next writing exercise!"
  }
  return `That's a great question! As a ${process.env.MOCK_LEVEL || 'B1'} level learner, here's my advice:\n\nEnglish learning requires consistent practice in all four skills: **Reading, Writing, Speaking, and Listening**. \n\nFor Rwandan teachers, I recommend:\n1. Read English newspapers daily (The New Times)\n2. Practice writing short paragraphs on education topics\n3. Listen to BBC Learning English podcasts\n4. Speak English with colleagues during breaks\n\nWhat specific aspect would you like to work on?`
}
