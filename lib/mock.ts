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
    'Effective communication in English opens doors to global opportunities. Professionals who can articulate their ideas clearly in English are more likely to advance in their careers. Regular practice, combined with feedback-driven learning, can significantly enhance both fluency and confidence.',
  overallFeedback:
    'Great effort! You scored 7/10. Your ideas are clear and well-organized. To improve further, practice speaking on academic topics daily and record yourself to identify areas for improvement.',
}

export const mockListeningContent = {
  passage:
    'The global demand for English proficiency has grown dramatically in recent years. Studies show that employees who speak fluent English earn on average 30 to 50 percent more than their peers in many countries. The rise of remote work has further increased this demand, as international companies seek talent regardless of location. Online learning platforms powered by artificial intelligence have made English education more accessible and personalized than ever before. These platforms can adapt to individual learning speeds, provide instant feedback, and offer practice in all four language skills: reading, writing, speaking, and listening.',
  questions: [
    {
      question: 'How much more do English-speaking employees earn on average?',
      options: ['10 to 20 percent', '20 to 30 percent', '30 to 50 percent', '50 to 70 percent'],
      correct: 2,
      explanation:
        'The passage states employees who speak fluent English earn "30 to 50 percent more" than their peers.',
    },
    {
      question: 'What has further increased the demand for English proficiency?',
      options: ['Tourism', 'Social media', 'Remote work', 'Immigration'],
      correct: 2,
      explanation: 'The passage states "The rise of remote work has further increased this demand."',
    },
    {
      question: 'What technology has made English education more accessible?',
      options: ['Virtual reality', 'Artificial intelligence', 'Blockchain', 'Social networks'],
      correct: 1,
      explanation: 'The passage mentions "Online learning platforms powered by artificial intelligence."',
    },
    {
      question: 'How many language skills do AI platforms practice?',
      options: ['Two', 'Three', 'Four', 'Five'],
      correct: 2,
      explanation:
        'The passage lists four skills: "reading, writing, speaking, and listening."',
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
    return "Great question! The **passive voice** is formed with **be + past participle**.\n\nExamples:\n- Active: *The manager approves the report.*\n- Passive: *The report is approved by the manager.*\n\nWe use passive voice when:\n1. The action is more important than who did it\n2. We don't know who did the action\n3. It sounds more formal\n\nWould you like to practice with some exercises?"
  }
  if (lower.includes('since') || lower.includes(' for ')) {
    return '**Since** vs **For** — a common question!\n\n- Use **FOR** with a duration (length of time):\n  - *I have lived here **for** 5 years.*\n  - *She studied **for** 3 hours.*\n\n- Use **SINCE** with a starting point in time:\n  - *I have lived here **since** 2019.*\n  - *She has worked here **since** January.*\n\nTip: If you can replace it with "a duration of", use **for**. If you can replace it with "starting from", use **since**.'
  }
  if (lower.includes('vocabulary') || lower.includes('word')) {
    return "Here are some **advanced vocabulary words** useful for academic writing:\n\n| Basic | Advanced |\n|-------|----------|\n| show | demonstrate, illustrate |\n| big | significant, substantial |\n| think | argue, contend, assert |\n| use | utilize, employ |\n| help | facilitate, enhance |\n\nTry to use these in your next writing exercise!"
  }
  return `That's a great question! As a ${process.env.MOCK_LEVEL || 'B1'} level learner, here's my advice:\n\nEnglish learning requires consistent practice in all four skills: **Reading, Writing, Speaking, and Listening**. \n\nHere are my top recommendations:\n1. Read English articles daily (BBC, The Guardian)\n2. Practice writing short paragraphs on topics you care about\n3. Listen to English podcasts (BBC Learning English, TED Talks)\n4. Speak English whenever you get the chance — even to yourself!\n\nWhat specific aspect would you like to work on?`
}
