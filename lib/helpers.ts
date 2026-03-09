// Client-safe helper functions (no Anthropic SDK)

export function getWritingPrompt(taskType: string, level: string): string {
  const task1Prompts: Record<string, string[]> = {
    A1: [
      'Look at the table below showing school attendance data. Write 3-5 sentences describing what you see. Mention the numbers and any changes.\n\n[Minimum: 40 words]',
      'Look at the chart below. Write 3-5 sentences describing the information shown.\n\n[Minimum: 40 words]',
    ],
    A2: [
      'The table below shows school attendance in Rwanda from 2020 to 2023. Write a short paragraph (50-80 words) describing the main changes you observe.',
      'Look at the chart below showing subjects preferred by students. Write a paragraph (50-80 words) summarizing the key information.',
    ],
    B1: [
      'The chart below shows student enrollment trends in primary schools. Write at least 150 words summarizing the main trends. Include an introduction, describe key changes, and write a brief conclusion.',
      'The pie chart below shows subjects preferred by students. Write at least 150 words describing the data. Mention the most and least popular subjects, compare percentages, and summarize the overall pattern.',
    ],
    B2: [
      'The graph below illustrates changes in teacher-to-student ratios across East African countries. Write at least 200 words analyzing the data. Identify trends, make comparisons, and highlight significant features.',
      'The bar charts below compare literacy rates before and after educational reforms. Write at least 200 words. Describe the data, identify similarities and differences, and draw conclusions.',
    ],
    C1: [
      'The data below shows correlations between GDP investment in education and literacy outcomes. Write at least 250 words synthesizing the key findings. Use academic language, make inferences, and evaluate the significance of the data.',
      'The multi-line graph below shows education spending trends. Write at least 250 words. Analyze complex trends, discuss implications, and use sophisticated vocabulary.',
    ],
    C2: [
      'Critically evaluate the statistical evidence presented in the charts below about educational inequality in sub-Saharan Africa. Write at least 300 words using academic register, nuanced analysis, and well-structured argumentation.',
    ],
  }

  const task2Prompts: Record<string, string[]> = {
    A1: [
      'Write about your favorite subject and why you like it.\n\nWrite 5-8 simple sentences (40-60 words). Use present tense.',
      'Write about a good teacher you know.\n\nWrite 5-8 simple sentences (40-60 words). Describe what makes them good.',
    ],
    A2: [
      'Write about why education is important for children.\n\nWrite 1-2 paragraphs (80-120 words). Give at least 2 reasons with examples.',
      'Describe a school rule you think is good.\n\nWrite 1-2 paragraphs (80-120 words). Explain the rule and why it helps.',
    ],
    B1: [
      'Do you think technology helps students learn better? Give your opinion.\n\nWrite an essay of at least 150 words with:\n• An introduction stating your opinion\n• 2-3 body paragraphs with reasons and examples\n• A conclusion',
      'Should schools focus more on practical skills or academic subjects?\n\nWrite an essay of at least 150 words with:\n• An introduction stating your position\n• 2-3 supporting paragraphs\n• A conclusion summarizing your view',
    ],
    B2: [
      'To what extent does the quality of teaching determine student achievement? Discuss with evidence.\n\nWrite a well-structured essay of at least 200 words. Include an introduction, at least 3 body paragraphs with arguments and examples, and a conclusion.',
      'Evaluate the impact of using English as the medium of instruction in non-English-speaking countries.\n\nWrite a balanced essay of at least 200 words discussing both advantages and disadvantages.',
    ],
    C1: [
      'Critically discuss the relationship between teacher professional development and student outcomes in developing nations.\n\nWrite an academic essay of at least 250 words. Use formal register, cite potential evidence, present multiple perspectives, and reach a nuanced conclusion.',
      'Analyze the role of standardized testing in shaping educational equity.\n\nWrite an academic essay of at least 250 words with sophisticated argumentation and varied sentence structures.',
    ],
    C2: [
      'Evaluate the philosophical and empirical arguments for and against inclusive education in resource-constrained environments.\n\nWrite a scholarly essay of at least 300 words demonstrating mastery of academic English, nuanced critical analysis, and cohesive argumentation.',
    ],
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
