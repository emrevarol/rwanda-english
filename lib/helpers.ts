// Client-safe helper functions (no Anthropic SDK)

export function getWritingPrompt(taskType: string, level: string): string {
  const task1Prompts: Record<string, string[]> = {
    A1: [
      'Look at the table below showing monthly sales data. Write 3-5 sentences describing what you see. Mention the numbers and any changes.\n\n[Minimum: 40 words]',
      'Look at the chart below. Write 3-5 sentences describing the information shown.\n\n[Minimum: 40 words]',
    ],
    A2: [
      'The table below shows internet usage trends from 2020 to 2023. Write a short paragraph (50-80 words) describing the main changes you observe.',
      'Look at the chart below showing the most popular hobbies among young adults. Write a paragraph (50-80 words) summarizing the key information.',
    ],
    B1: [
      'The chart below shows global smartphone adoption trends. Write at least 150 words summarizing the main trends. Include an introduction, describe key changes, and write a brief conclusion.',
      'The pie chart below shows how people spend their free time. Write at least 150 words describing the data. Mention the most and least common activities, compare percentages, and summarize the overall pattern.',
    ],
    B2: [
      'The graph below illustrates changes in remote work adoption across different industries. Write at least 200 words analyzing the data. Identify trends, make comparisons, and highlight significant features.',
      'The bar charts below compare English proficiency scores before and after online learning programs. Write at least 200 words. Describe the data, identify similarities and differences, and draw conclusions.',
    ],
    C1: [
      'The data below shows correlations between English proficiency and average salary across different countries. Write at least 250 words synthesizing the key findings. Use academic language, make inferences, and evaluate the significance of the data.',
      'The multi-line graph below shows global education spending trends. Write at least 250 words. Analyze complex trends, discuss implications, and use sophisticated vocabulary.',
    ],
    C2: [
      'Critically evaluate the statistical evidence presented in the charts below about the economic impact of language skills in the global workforce. Write at least 300 words using academic register, nuanced analysis, and well-structured argumentation.',
    ],
  }

  const task2Prompts: Record<string, string[]> = {
    A1: [
      'Write about your favorite hobby and why you like it.\n\nWrite 5-8 simple sentences (40-60 words). Use present tense.',
      'Write about a person you admire.\n\nWrite 5-8 simple sentences (40-60 words). Describe what makes them special.',
    ],
    A2: [
      'Write about why learning English is important for your career.\n\nWrite 1-2 paragraphs (80-120 words). Give at least 2 reasons with examples.',
      'Describe a place you would like to visit.\n\nWrite 1-2 paragraphs (80-120 words). Explain where it is and why you want to go.',
    ],
    B1: [
      'Do you think technology helps people learn better? Give your opinion.\n\nWrite an essay of at least 150 words with:\n• An introduction stating your opinion\n• 2-3 body paragraphs with reasons and examples\n• A conclusion',
      'Should companies require employees to speak English? Why or why not?\n\nWrite an essay of at least 150 words with:\n• An introduction stating your position\n• 2-3 supporting paragraphs\n• A conclusion summarizing your view',
    ],
    B2: [
      'To what extent does English proficiency affect career opportunities in the global job market? Discuss with evidence.\n\nWrite a well-structured essay of at least 200 words. Include an introduction, at least 3 body paragraphs with arguments and examples, and a conclusion.',
      'Evaluate the advantages and disadvantages of learning English through AI-powered platforms compared to traditional classroom instruction.\n\nWrite a balanced essay of at least 200 words discussing both sides.',
    ],
    C1: [
      'Critically discuss the relationship between language skills and economic mobility in the modern global economy.\n\nWrite an academic essay of at least 250 words. Use formal register, cite potential evidence, present multiple perspectives, and reach a nuanced conclusion.',
      'Analyze the role of English as a global lingua franca and its impact on cultural identity.\n\nWrite an academic essay of at least 250 words with sophisticated argumentation and varied sentence structures.',
    ],
    C2: [
      'Evaluate the philosophical and empirical arguments for and against English as the dominant language of international business and academia.\n\nWrite a scholarly essay of at least 300 words demonstrating mastery of academic English, nuanced critical analysis, and cohesive argumentation.',
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
    A2: ['Talk about your daily routine.', 'What do you do on weekends?', 'Describe your neighborhood.'],
    B1: ['What are the biggest challenges of learning English?', 'How can technology improve language learning?', 'Talk about a goal you want to achieve this year.'],
    B2: ['Discuss the importance of English proficiency in the global job market.', 'How has social media changed communication?', 'Evaluate the pros and cons of working remotely.'],
    C1: ['Analyze the relationship between language skills and career success.', 'Discuss the impact of AI on education and learning.'],
    C2: ['Critically evaluate the role of English as a global lingua franca in the 21st century.', 'Debate the merits of self-directed learning vs structured education.'],
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
        'She don\'t go to work yesterday.',
        'She didn\'t go to work yesterday.',
        'She not go to work yesterday.',
        'She doesn\'t went to work yesterday.',
      ],
    },
    {
      id: 2,
      question: 'Fill in the blank: "If I _____ a lot of money, I would travel the world."',
      type: 'multiple-choice',
      options: ['have', 'had', 'has', 'having'],
    },
    {
      id: 3,
      question: 'What does "proficiency" mean?',
      type: 'multiple-choice',
      options: [
        'A high level of skill or competence',
        'Related to mathematics',
        'Related to building construction',
        'Related to music',
      ],
    },
    {
      id: 4,
      question: 'Write 2-3 sentences about why English is important for your career.',
      type: 'open',
      hint: 'Think about job opportunities, communication, global business...',
    },
    {
      id: 5,
      question: 'Choose the most formal sentence for a business email:',
      type: 'multiple-choice',
      options: [
        'Hey, just wanted to check in about the project.',
        'I am writing to inquire about the status of the project.',
        'So what\'s going on with that project thing?',
        'Project update please, thanks.',
      ],
    },
    {
      id: 6,
      question: 'Which word best completes: "The manager gave a _____ explanation of the complex issue."',
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
      question: 'What is the passive form of: "The company funds the program."',
      type: 'multiple-choice',
      options: [
        'The program is funded by the company.',
        'The program is funded by the company.',
        'The program were funded the company.',
        'The company is funding by the program.',
      ],
    },
    {
      id: 10,
      question: 'In 3-5 sentences, describe how improving your English could benefit your career or daily life.',
      type: 'open',
      hint: 'Consider: better job opportunities, communication, travel, online resources...',
    },
  ]
}
