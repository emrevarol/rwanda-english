// Client-safe helper functions (no Anthropic SDK)

export function getWritingPrompt(taskType: string, level: string): string {
  const task1Prompts: Record<string, string[]> = {
    A1: ['Describe your classroom. What is in it?', 'Describe a typical school day.'],
    A2: ['Describe the changes in the table about school attendance in Rwanda (2020-2023).', 'Write about your school.'],
    B1: ['The chart shows student enrollment trends in Rwandan primary schools. Summarize the main trends.', 'Describe the pie chart showing subjects preferred by students.'],
    B2: ['The graph illustrates changes in teacher-to-student ratios across East African countries. Analyze the data.', 'Compare the bar charts showing literacy rates before and after educational reforms.'],
    C1: ['The data shows correlations between GDP investment in education and literacy outcomes. Synthesize the key findings.', 'Analyze the complex trends shown in the multi-line graph about education spending.'],
    C2: ['Critically evaluate the statistical evidence presented in the charts about educational inequality in sub-Saharan Africa.'],
  }

  const task2Prompts: Record<string, string[]> = {
    A1: ['Write about your favorite subject and why you like it.', 'Write about a good teacher.'],
    A2: ['Write about why education is important for children.', 'Describe a school rule you think is good.'],
    B1: ['Do you think technology helps students learn better? Give your opinion with examples.', 'Should schools focus more on practical skills or academic subjects?'],
    B2: ['To what extent does the quality of teaching determine student achievement? Discuss with evidence.', 'Evaluate the impact of mother-tongue instruction vs English-medium education in Rwanda.'],
    C1: ['Critically discuss the relationship between teacher professional development and student outcomes in developing nations.', 'Analyze the role of standardized testing in shaping educational equity.'],
    C2: ['Evaluate the philosophical and empirical arguments for and against inclusive education in resource-constrained environments.'],
  }

  const prompts = taskType === 'task1'
    ? (task1Prompts[level] || task1Prompts['B1'])
    : (task2Prompts[level] || task2Prompts['B1'])

  return prompts[Math.floor(Math.random() * prompts.length)]
}

export function getSpeakingTopic(level: string): string {
  const topics: Record<string, string[]> = {
    A1: ['Talk about your family.', 'What is your favorite food?', 'Describe your home.'],
    A2: ['Talk about your daily routine as a teacher.', 'What do you do on weekends?', 'Describe your school.'],
    B1: ['What challenges do teachers face in Rwanda?', 'How can technology improve education?', 'Talk about a memorable lesson you taught.'],
    B2: ['Discuss the importance of English proficiency for Rwandan teachers.', 'How should schools address learning difficulties?', 'Evaluate the role of parental involvement in education.'],
    C1: ['Analyze the relationship between teacher motivation and student outcomes.', 'Discuss curriculum reform strategies for developing nations.'],
    C2: ['Critically evaluate the pedagogical implications of Rwanda\'s language policy in education.', 'Debate the merits of competency-based vs knowledge-based curricula.'],
  }

  const levelTopics = topics[level] || topics['B1']
  return levelTopics[Math.floor(Math.random() * levelTopics.length)]
}

export function getAssessmentQuestions(): Array<{
  id: number
  question: string
  type: 'multiple-choice' | 'open'
  options?: string[]
  hint?: string
}> {
  return [
    {
      id: 1,
      question: 'Choose the correct sentence:',
      type: 'multiple-choice',
      options: [
        'She don\'t go to school yesterday.',
        'She didn\'t go to school yesterday.',
        'She not go to school yesterday.',
        'She doesn\'t went to school yesterday.',
      ],
    },
    {
      id: 2,
      question: 'Fill in the blank: "If I _____ a lot of money, I would build a school."',
      type: 'multiple-choice',
      options: ['have', 'had', 'has', 'having'],
    },
    {
      id: 3,
      question: 'What does "pedagogical" mean?',
      type: 'multiple-choice',
      options: [
        'Related to teaching methods',
        'Related to mathematics',
        'Related to building construction',
        'Related to music',
      ],
    },
    {
      id: 4,
      question: 'Write 2-3 sentences about the most important quality of a good teacher.',
      type: 'open',
      hint: 'Think about patience, knowledge, communication...',
    },
    {
      id: 5,
      question: 'Choose the most formal sentence for a report:',
      type: 'multiple-choice',
      options: [
        'Lots of kids don\'t come to school.',
        'Student attendance has declined significantly.',
        'Kids aren\'t showing up much these days.',
        'Many students they don\'t attend school.',
      ],
    },
    {
      id: 6,
      question: 'Which word best completes: "The teacher gave a _____ explanation of the complex topic."',
      type: 'multiple-choice',
      options: ['lucid', 'big', 'fast', 'many'],
    },
    {
      id: 7,
      question: 'Write a sentence using the word "although" to show contrast.',
      type: 'open',
      hint: 'Example structure: Although [one idea], [contrasting idea].',
    },
    {
      id: 8,
      question: 'Identify the grammatically correct sentence:',
      type: 'multiple-choice',
      options: [
        'The data shows a significant increase.',
        'The data show a significant increase.',
        'The datas shows increase.',
        'Datas are showing significant increase.',
      ],
    },
    {
      id: 9,
      question: 'What is the passive form of: "The government funds the schools."',
      type: 'multiple-choice',
      options: [
        'The schools are funded by the government.',
        'The schools is funded by the government.',
        'The schools were funded the government.',
        'The government is funding by the schools.',
      ],
    },
    {
      id: 10,
      question: 'In 3-5 sentences, describe the main challenges facing education in your country and suggest one solution.',
      type: 'open',
      hint: 'Consider: resources, teacher training, infrastructure, language...',
    },
  ]
}
