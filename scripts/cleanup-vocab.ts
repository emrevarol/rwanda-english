/**
 * Clean up vocabulary pool:
 * 1. Delete all A1 idioms (mostly wrong level) and replace with real A1 expressions
 * 2. Remove duplicates across all levels
 * 3. Remove inappropriate words ("shut up", "rock and roll")
 * 4. Fix grammar errors
 * 5. Delete A1 academic (category doesn't make sense at A1)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Real A1 formulaic expressions (not complex idioms)
const A1_EXPRESSIONS: Array<{ word: string; definition: string; example: string }> = [
  { word: 'have a nice day', definition: 'a friendly way to say goodbye', example: 'Thank you for shopping! Have a nice day!' },
  { word: 'good luck', definition: 'you hope something good will happen to someone', example: 'Good luck on your English test tomorrow!' },
  { word: 'see you later', definition: 'a friendly way to say goodbye when you will meet again', example: 'Bye! See you later at school.' },
  { word: 'how are you', definition: 'a greeting to ask about someone\'s feelings or health', example: 'Hello, Maria! How are you today?' },
  { word: 'nice to meet you', definition: 'what you say when you meet someone for the first time', example: 'My name is Tom. Nice to meet you!' },
  { word: 'excuse me', definition: 'a polite way to get someone\'s attention or say sorry', example: 'Excuse me, where is the bathroom?' },
  { word: 'no problem', definition: 'a friendly way to say "you\'re welcome" or "it\'s okay"', example: 'Thank you for your help! — No problem!' },
  { word: 'take care', definition: 'a friendly way to say goodbye, meaning "be safe"', example: 'Goodbye! Take care!' },
  { word: 'of course', definition: 'yes, certainly', example: 'Can I sit here? — Of course!' },
  { word: 'i don\'t know', definition: 'you do not have the answer', example: 'What time is the bus? — I don\'t know, sorry.' },
  { word: 'come on', definition: 'used to encourage someone or ask them to hurry', example: 'Come on, we are late for school!' },
  { word: 'well done', definition: 'used to praise someone who did something good', example: 'You got 100% on the test? Well done!' },
  { word: 'it\'s okay', definition: 'it is not a problem; don\'t worry', example: 'Sorry I\'m late. — It\'s okay, don\'t worry.' },
  { word: 'what\'s up', definition: 'an informal greeting meaning "how are you" or "what is happening"', example: 'Hey, what\'s up? — Not much, just studying.' },
  { word: 'by the way', definition: 'used to add new information to a conversation', example: 'By the way, the shop closes at 6 today.' },
  { word: 'i\'m sorry', definition: 'used to apologize or show you feel bad', example: 'I\'m sorry, I broke your pen.' },
  { word: 'thank you very much', definition: 'a very polite way to show thanks', example: 'Thank you very much for the birthday present!' },
  { word: 'that\'s right', definition: 'used to agree or confirm something is correct', example: 'Is this your bag? — That\'s right, thank you.' },
  { word: 'just a moment', definition: 'please wait a very short time', example: 'Just a moment, I need to find my keys.' },
  { word: 'go ahead', definition: 'you can do it; permission to start', example: 'Can I open the window? — Go ahead!' },
]

// Real A1 academic words (very basic school/learning words)
const A1_ACADEMIC: Array<{ word: string; definition: string; example: string }> = [
  { word: 'book', definition: 'pages with words that you read', example: 'I read a book every night before bed.' },
  { word: 'page', definition: 'one side of a paper in a book', example: 'Please open your book to page 10.' },
  { word: 'word', definition: 'a unit of language that has meaning', example: 'I learned five new words today.' },
  { word: 'question', definition: 'something you ask to get information', example: 'The teacher asked a question about the story.' },
  { word: 'answer', definition: 'what you say or write when someone asks a question', example: 'Do you know the answer to number five?' },
  { word: 'test', definition: 'questions to check what you have learned', example: 'We have a spelling test on Friday.' },
  { word: 'homework', definition: 'school work that you do at home', example: 'I need to finish my homework before dinner.' },
  { word: 'lesson', definition: 'a time when a teacher teaches you something', example: 'Our English lesson starts at 9 o\'clock.' },
  { word: 'teacher', definition: 'a person who helps you learn at school', example: 'My teacher is very kind and helpful.' },
  { word: 'student', definition: 'a person who studies at school', example: 'There are 20 students in my class.' },
  { word: 'class', definition: 'a group of students who learn together', example: 'My class is learning about animals this week.' },
  { word: 'learn', definition: 'to get knowledge or a new skill', example: 'I want to learn how to play the guitar.' },
  { word: 'study', definition: 'to spend time learning about a subject', example: 'I study English for 30 minutes every day.' },
  { word: 'read', definition: 'to look at words and understand them', example: 'Can you read this sentence for me?' },
  { word: 'write', definition: 'to put words on paper or a screen', example: 'Please write your name on the paper.' },
  { word: 'practice', definition: 'to do something many times to get better', example: 'I practice speaking English with my friend.' },
  { word: 'easy', definition: 'not hard; simple to do or understand', example: 'This question is easy. I know the answer!' },
  { word: 'difficult', definition: 'hard; not easy to do or understand', example: 'Math is difficult for me, but English is easy.' },
  { word: 'correct', definition: 'right; without mistakes', example: 'All your answers are correct. Good job!' },
  { word: 'mistake', definition: 'something that is wrong or not correct', example: 'I made a mistake on question three.' },
]

// Words to remove from ANY level
const BLACKLIST = ['shut up', 'rock and roll', 'a apple a day']

async function main() {
  console.log('=== VOCAB CLEANUP ===\n')

  // 1. Delete ALL A1 idioms (will replace with correct ones)
  const delIdioms = await prisma.vocabularyWord.deleteMany({
    where: { level: 'A1', category: 'idioms' },
  })
  console.log(`Deleted ${delIdioms.count} A1 idioms`)

  // 2. Delete ALL A1 academic (will replace)
  const delAcademic = await prisma.vocabularyWord.deleteMany({
    where: { level: 'A1', category: 'academic' },
  })
  console.log(`Deleted ${delAcademic.count} A1 academic`)

  // 3. Remove blacklisted words from all levels
  for (const bad of BLACKLIST) {
    const del = await prisma.vocabularyWord.deleteMany({
      where: { word: bad },
    })
    if (del.count > 0) console.log(`Removed "${bad}" (${del.count} entries)`)
  }

  // 4. Remove duplicates across all levels (keep one with lowest usedCount)
  const allWords = await prisma.vocabularyWord.findMany({
    orderBy: { usedCount: 'asc' },
  })
  const seen = new Map<string, string>() // key: word+level+category → id to keep
  const toDelete: string[] = []
  for (const w of allWords) {
    const key = `${w.word}|${w.level}|${w.category}`
    if (seen.has(key)) {
      toDelete.push(w.id)
    } else {
      seen.set(key, w.id)
    }
  }
  if (toDelete.length > 0) {
    const delDups = await prisma.vocabularyWord.deleteMany({
      where: { id: { in: toDelete } },
    })
    console.log(`Removed ${delDups.count} duplicates`)
  }

  // 5. Also check for near-duplicates (same word in same level but listed slightly differently)
  // e.g., "piece of cake" vs "a piece of cake"
  const allRemaining = await prisma.vocabularyWord.findMany({
    select: { id: true, word: true, level: true, category: true },
  })
  const nearDups: string[] = []
  const wordMap = new Map<string, string>() // normalized → first id
  for (const w of allRemaining) {
    const normalized = w.word.replace(/^(a |an |the |to )/, '').trim() + '|' + w.level + '|' + w.category
    if (wordMap.has(normalized)) {
      nearDups.push(w.id)
    } else {
      wordMap.set(normalized, w.id)
    }
  }
  if (nearDups.length > 0) {
    const delNear = await prisma.vocabularyWord.deleteMany({
      where: { id: { in: nearDups } },
    })
    console.log(`Removed ${delNear.count} near-duplicates`)
  }

  // 6. Insert correct A1 idioms
  let insertedIdioms = 0
  for (const w of A1_EXPRESSIONS) {
    try {
      await prisma.vocabularyWord.create({
        data: { word: w.word, definition: w.definition, example: w.example, level: 'A1', category: 'idioms', usedCount: 0 },
      })
      insertedIdioms++
    } catch { /* duplicate */ }
  }
  console.log(`Inserted ${insertedIdioms} correct A1 expressions`)

  // 7. Insert correct A1 academic
  let insertedAcademic = 0
  for (const w of A1_ACADEMIC) {
    try {
      await prisma.vocabularyWord.create({
        data: { word: w.word, definition: w.definition, example: w.example, level: 'A1', category: 'academic', usedCount: 0 },
      })
      insertedAcademic++
    } catch { /* duplicate */ }
  }
  console.log(`Inserted ${insertedAcademic} correct A1 academic words`)

  // 8. Final count
  const finalCount = await prisma.vocabularyWord.count()
  const byLevel = await prisma.vocabularyWord.groupBy({
    by: ['level'],
    _count: true,
    orderBy: { level: 'asc' },
  })
  console.log(`\nFinal total: ${finalCount}`)
  for (const l of byLevel) {
    console.log(`  ${l.level}: ${l._count}`)
  }

  await prisma.$disconnect()
}

main().catch(console.error)
