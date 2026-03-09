// 365-day learning path curriculum
// Each day = 2 tasks × 15 minutes

export type TaskType = 'writing-essay' | 'writing-chart' | 'listening' | 'tutor' | 'vocabulary'

export interface DayTask {
  type: TaskType
  titleKey: string
  description: string
  duration: number // minutes
  href: string
  icon: string
  color: string
}

export interface DayPlan {
  day: number
  week: number
  themeKey: string
  theme: string // fallback
  task1: DayTask
  task2: DayTask
  tipKey: string
  tip: string // fallback
}

interface TaskPoolEntry {
  type: TaskType
  titleKey: string
  duration: number
  href: string
  icon: string
  color: string
}

const TASK_POOL: Record<TaskType, TaskPoolEntry> = {
  'writing-essay': {
    type: 'writing-essay',
    titleKey: 'taskTitles.writingEssay',
    duration: 15,
    href: '/writing',
    icon: '✍️',
    color: 'blue',
  },
  'writing-chart': {
    type: 'writing-chart',
    titleKey: 'taskTitles.writingChart',
    duration: 15,
    href: '/writing',
    icon: '📊',
    color: 'indigo',
  },
  listening: {
    type: 'listening',
    titleKey: 'taskTitles.listening',
    duration: 15,
    href: '/listening',
    icon: '🎧',
    color: 'purple',
  },
  tutor: {
    type: 'tutor',
    titleKey: 'taskTitles.tutor',
    duration: 15,
    href: '/tutor',
    icon: '🤖',
    color: 'green',
  },
  vocabulary: {
    type: 'vocabulary',
    titleKey: 'taskTitles.vocabulary',
    duration: 15,
    href: '/tutor',
    icon: '📚',
    color: 'orange',
  },
}

// 7-day rotating schedule
const WEEKLY_PATTERNS: Array<{ task1: TaskType; task2: TaskType; themeKey: string; tipKey: string }> = [
  { task1: 'writing-essay', task2: 'listening', themeKey: 'themes.expressionComprehension', tipKey: 'tips.readAloud' },
  { task1: 'tutor', task2: 'writing-chart', themeKey: 'themes.grammarFocus', tipKey: 'tips.askGrammar' },
  { task1: 'listening', task2: 'writing-essay', themeKey: 'themes.inputOutput', tipKey: 'tips.listenTwice' },
  { task1: 'writing-chart', task2: 'tutor', themeKey: 'themes.academicSkills', tipKey: 'tips.usePhrases' },
  { task1: 'vocabulary', task2: 'listening', themeKey: 'themes.vocabularyBuilding', tipKey: 'tips.learnWords' },
  { task1: 'tutor', task2: 'writing-essay', themeKey: 'themes.fluencyWriting', tipKey: 'tips.setTimer' },
  { task1: 'listening', task2: 'vocabulary', themeKey: 'themes.weeklyReview', tipKey: 'tips.reviewWeek' },
]

const TASK_DESCRIPTIONS: Record<TaskType, (day: number, level: string) => string> = {
  'writing-essay': (day, level) => {
    const topics: Record<string, string[]> = {
      A1: ['Write about your school', 'Describe your classroom', 'Write about your favorite teacher'],
      A2: ['Write about why education is important', 'Describe a good lesson you taught'],
      B1: ['Should technology replace teachers? Give your opinion', 'What makes a great school?'],
      B2: ['Discuss the impact of English on education', 'Evaluate teacher training programs'],
      C1: ['Critically assess inclusive education policies', 'Analyze curriculum reform challenges'],
      C2: ['Evaluate philosophical approaches to education equity'],
    }
    const t = topics[level] || topics['B1']
    return t[day % t.length]
  },
  'writing-chart': (day, level) => {
    const topics: Record<string, string[]> = {
      A1: ['Describe the table showing class sizes'],
      A2: ['Summarize the bar chart about student attendance'],
      B1: ['Describe the line graph showing literacy rates 2010-2023'],
      B2: ['Analyze the charts comparing education spending'],
      C1: ['Synthesize the data on teacher-student ratios and learning outcomes'],
      C2: ['Critically evaluate the statistical evidence on education inequality'],
    }
    const t = topics[level] || topics['B1']
    return t[day % t.length]
  },
  listening: () => 'Listen to the AI-generated passage and answer comprehension questions',
  tutor: (day, level) => {
    const prompts: Record<string, string[]> = {
      A1: ['Practice basic greetings and introductions', 'Ask about simple grammar rules'],
      A2: ['Practice talking about daily routines', 'Learn common classroom expressions'],
      B1: ['Discuss challenges of teaching in English', 'Practice explaining complex ideas simply'],
      B2: ['Debate education policy topics', 'Practice formal academic language'],
      C1: ['Discuss research and evidence in education', 'Practice academic argument construction'],
      C2: ['Engage in sophisticated pedagogical debate', 'Critique educational philosophies'],
    }
    const t = prompts[level] || prompts['B1']
    return t[day % t.length]
  },
  vocabulary: (day, level) => {
    const sessions: Record<string, string[]> = {
      A1: ['Learn 5 classroom words', 'Practice common verbs'],
      A2: ['Learn education vocabulary', 'Practice adjectives'],
      B1: ['Academic word list — Group ' + ((day % 10) + 1), 'Connective phrases for essays'],
      B2: ['Advanced academic vocabulary', 'Idiomatic expressions in education'],
      C1: ['Technical pedagogical vocabulary', 'Rhetorical devices and discourse markers'],
      C2: ['Nuanced academic register', 'Collocations and fixed phrases'],
    }
    const t = sessions[level] || sessions['B1']
    return t[day % t.length]
  },
}

export function getDayPlan(dayNumber: number, level: string): DayPlan {
  const weekIndex = (dayNumber - 1) % 7
  const pattern = WEEKLY_PATTERNS[weekIndex]
  const week = Math.ceil(dayNumber / 7)

  const makeTask = (type: TaskType): DayTask => ({
    ...TASK_POOL[type],
    description: TASK_DESCRIPTIONS[type](dayNumber, level),
  })

  return {
    day: dayNumber,
    week,
    themeKey: pattern.themeKey,
    theme: pattern.themeKey, // fallback, will be resolved by client
    task1: makeTask(pattern.task1),
    task2: makeTask(pattern.task2),
    tipKey: pattern.tipKey,
    tip: pattern.tipKey, // fallback
  }
}

export function getTodayDayNumber(startDate: Date): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  const diffMs = today.getTime() - start.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return Math.min(Math.max(diffDays + 1, 1), 365)
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

export function getStreakCount(completedDates: string[]): number {
  if (completedDates.length === 0) return 0
  const sorted = [...completedDates].sort().reverse()
  const today = getTodayString()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  if (sorted[0] !== today && sorted[0] !== yesterdayStr) return 0

  let streak = 0
  let current = new Date()
  if (sorted[0] === today) {
    streak = 1
    current.setDate(current.getDate() - 1)
  } else {
    current = yesterday
  }

  for (let i = 1; i < sorted.length; i++) {
    const expected = current.toISOString().split('T')[0]
    if (sorted[i] === expected) {
      streak++
      current.setDate(current.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}
