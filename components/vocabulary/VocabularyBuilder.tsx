'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { markDailyTaskDone } from '@/lib/dailyComplete'
import SubscriptionPaywall from '@/components/shared/SubscriptionPaywall'
import MilestoneProgress from '@/components/shared/MilestoneProgress'

interface Word {
  word: string
  definition: string
  example: string
  category: string
}

interface UserWord extends Word {
  id: string
  mastery: number
  correct: number
  incorrect: number
}

type GameMode = 'menu' | 'flashcards' | 'match' | 'fillblank' | 'spelling'

export default function VocabularyBuilder({ userLevel, initialCategory }: { userLevel: string; initialCategory?: string }) {
  const t = useTranslations('vocabulary')

  const [mode, setMode] = useState<GameMode>('menu')
  const [category, setCategory] = useState(initialCategory || 'general')
  const [words, setWords] = useState<Word[]>([])
  const [userWords, setUserWords] = useState<UserWord[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ total: 0, mastered: 0, learning: 0, new_words: 0 })
  const [error, setError] = useState('')
  const [showPaywall, setShowPaywall] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const sessionStartRef = useRef<Date>(new Date())

  // Flashcard quiz state
  const [flashIndex, setFlashIndex] = useState(0)
  const [flashInput, setFlashInput] = useState('')
  const [flashResult, setFlashResult] = useState<'correct' | 'wrong' | null>(null)
  const [flashScore, setFlashScore] = useState(0)
  const flashInputRef = useRef<HTMLInputElement>(null)
  const flashJustCheckedRef = useRef(false)

  // Match game state
  const [matchWords, setMatchWords] = useState<{ word: string; definition: string; id: number }[]>([])
  const [selectedWord, setSelectedWord] = useState<number | null>(null)
  const [selectedDef, setSelectedDef] = useState<number | null>(null)
  const [matchedPairs, setMatchedPairs] = useState<number[]>([])
  const [matchWrong, setMatchWrong] = useState(false)
  const [matchScore, setMatchScore] = useState(0)

  // Fill in blank state
  const [fillQuestions, setFillQuestions] = useState<{ sentence: string; answer: string; options: string[] }[]>([])
  const [fillIndex, setFillIndex] = useState(0)
  const [fillSelected, setFillSelected] = useState<string | null>(null)
  const [fillCorrect, setFillCorrect] = useState<boolean | null>(null)
  const [fillScore, setFillScore] = useState(0)

  // Spelling state
  const [spellIndex, setSpellIndex] = useState(0)
  const [spellInput, setSpellInput] = useState('')
  const [spellResult, setSpellResult] = useState<'correct' | 'wrong' | null>(null)
  const [spellScore, setSpellScore] = useState(0)

  const categories = [
    { id: 'general', label: t('catGeneral') },
    { id: 'academic', label: t('catAcademic') },
    { id: 'business', label: t('catBusiness') },
    { id: 'idioms', label: t('catIdioms') },
    { id: 'phrasal', label: t('catPhrasal') },
    { id: 'travel', label: t('catTravel') },
    { id: 'sports', label: t('catSports') },
    { id: 'food', label: t('catFood') },
  ]

  useEffect(() => {
    fetchStats()
    fetchUserWords()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/vocabulary/progress')
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
      }
    } catch {}
  }

  const fetchUserWords = async () => {
    try {
      const res = await fetch('/api/vocabulary/progress?words=true')
      if (res.ok) {
        const data = await res.json()
        setUserWords(data.words || [])
      }
    } catch {}
  }

  const generateWords = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/vocabulary/words?category=${category}`)
      if (res.ok) {
        const data = await res.json()
        setWords(data.words)
        return data.words as Word[]
      }
      const data = await res.json().catch(() => ({}))
      if (data.code === 'SUBSCRIPTION_REQUIRED') {
        setShowPaywall(true)
      } else {
        setError(data.error || t('generateError'))
      }
    } catch {
      setError(t('generateError'))
    }
    setLoading(false)
    return []
  }

  const saveProgress = async (word: string, correct: boolean) => {
    try {
      await fetch('/api/vocabulary/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, correct }),
      })
    } catch {}
  }

  // Timer
  useEffect(() => {
    sessionStartRef.current = new Date()
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - sessionStartRef.current.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const onGameComplete = () => markDailyTaskDone('vocabulary', Math.round(elapsed / 60))

  // --- FLASHCARDS (Quiz Mode) ---
  const startFlashcards = async () => {
    const w = await generateWords()
    if (w.length > 0) {
      setFlashIndex(0)
      setFlashInput('')
      setFlashResult(null)
      setFlashScore(0)
      setMode('flashcards')
      setTimeout(() => flashInputRef.current?.focus(), 100)
    }
    setLoading(false)
  }

  const checkFlashcard = async () => {
    const word = words[flashIndex]
    const userAnswer = flashInput.trim().toLowerCase()
    const definition = word.definition.toLowerCase()

    // Stop words to ignore in matching
    const stopWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'or',
      'and', 'not', 'but', 'that', 'this', 'it', 'its', 'as', 'do', 'does',
      'did', 'has', 'had', 'have', 'will', 'would', 'could', 'should', 'may',
      'can', 'very', 'more', 'most', 'also', 'than', 'then', 'just', 'about',
      'into', 'over', 'such', 'some', 'make', 'like', 'way', 'something',
      'someone', 'thing', 'things', 'used', 'using', 'which', 'when', 'what',
      'who', 'how', 'all', 'each', 'any', 'many', 'much', 'own', 'other',
    ])

    // Extract meaningful content words
    const extractWords = (s: string) =>
      s.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w))

    // Get word stems (simple suffix stripping)
    const stem = (w: string) => {
      if (w.endsWith('ing') && w.length > 5) return w.slice(0, -3)
      if (w.endsWith('tion') && w.length > 5) return w.slice(0, -4)
      if (w.endsWith('ness') && w.length > 5) return w.slice(0, -4)
      if (w.endsWith('ment') && w.length > 5) return w.slice(0, -4)
      if (w.endsWith('able') && w.length > 5) return w.slice(0, -4)
      if (w.endsWith('ible') && w.length > 5) return w.slice(0, -4)
      if (w.endsWith('ful') && w.length > 4) return w.slice(0, -3)
      if (w.endsWith('less') && w.length > 5) return w.slice(0, -4)
      if (w.endsWith('ly') && w.length > 4) return w.slice(0, -2)
      if (w.endsWith('ed') && w.length > 4) return w.slice(0, -2)
      if (w.endsWith('er') && w.length > 4) return w.slice(0, -2)
      if (w.endsWith('est') && w.length > 4) return w.slice(0, -3)
      if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y'
      if (w.endsWith('es') && w.length > 4) return w.slice(0, -2)
      if (w.endsWith('s') && w.length > 4) return w.slice(0, -1)
      return w
    }

    const defWords = extractWords(definition)
    const answerWords = extractWords(userAnswer)

    // Check if user typed the word itself (they should define it, not repeat it)
    const wordLower = word.word.toLowerCase()
    const isJustRepeating = answerWords.length <= 2 && answerWords.some(aw => wordLower.includes(aw) || aw.includes(wordLower))

    if (isJustRepeating && answerWords.length > 0) {
      setFlashResult('wrong')
      saveProgress(word.word, false)
      flashJustCheckedRef.current = true
      setTimeout(() => { flashJustCheckedRef.current = false }, 300)
      return
    }

    // Match using stems for more flexible comparison
    const matched = defWords.filter(dw =>
      answerWords.some(aw =>
        aw.includes(dw) || dw.includes(aw) ||
        stem(aw) === stem(dw) ||
        (aw.length > 3 && dw.length > 3 && (
          stem(aw).includes(stem(dw)) || stem(dw).includes(stem(aw))
        ))
      )
    )

    // Also check if the answer words appear in the example sentence context
    const exampleLower = word.example.toLowerCase()
    const exampleWords = extractWords(exampleLower)
    const contextMatch = answerWords.filter(aw =>
      exampleWords.some(ew => stem(aw) === stem(ew)) ||
      defWords.some(dw => stem(aw) === stem(dw))
    )

    // More lenient: need 30% keyword match OR significant context match
    const keywordRatio = defWords.length > 0 ? matched.length / defWords.length : 0
    const contextRatio = answerWords.length > 0 ? contextMatch.length / answerWords.length : 0

    // Accept if: 30%+ definition keywords matched, OR user wrote enough relevant words
    const correct = (defWords.length > 0 && keywordRatio >= 0.3) ||
                    (answerWords.length >= 2 && contextRatio >= 0.5 && matched.length >= 1)

    setFlashResult(correct ? 'correct' : 'wrong')
    if (correct) setFlashScore(prev => prev + 1)
    saveProgress(word.word, correct)
    flashJustCheckedRef.current = true
    setTimeout(() => { flashJustCheckedRef.current = false }, 300)
  }

  const nextFlashcard = () => {
    if (flashIndex < words.length - 1) {
      setFlashIndex(flashIndex + 1)
      setFlashInput('')
      setFlashResult(null)
      setTimeout(() => flashInputRef.current?.focus(), 50)
    } else {
      setMode('menu')
      fetchStats()
      onGameComplete()
    }
  }

  // --- MATCH GAME ---
  const startMatch = async () => {
    const w = await generateWords()
    if (w.length >= 6) {
      const selected = w.slice(0, 6).map((item, i) => ({ word: item.word, definition: item.definition, id: i }))
      setMatchWords(selected)
      setMatchedPairs([])
      setSelectedWord(null)
      setSelectedDef(null)
      setMatchWrong(false)
      setMatchScore(0)
      setMode('match')
    }
    setLoading(false)
  }

  const shuffledDefs = useCallback(() => {
    if (matchWords.length === 0) return []
    const defs = [...matchWords]
    // Stable shuffle based on first word
    for (let i = defs.length - 1; i > 0; i--) {
      const j = (i * 7 + 3) % (i + 1)
      ;[defs[i], defs[j]] = [defs[j], defs[i]]
    }
    return defs
  }, [matchWords])

  const handleMatchWord = (id: number) => {
    if (matchedPairs.includes(id)) return
    setSelectedWord(id)
    setMatchWrong(false)

    if (selectedDef !== null) {
      if (selectedDef === id) {
        setMatchedPairs(prev => [...prev, id])
        setMatchScore(prev => prev + 1)
        saveProgress(matchWords[id].word, true)
        setSelectedWord(null)
        setSelectedDef(null)
        if (matchedPairs.length + 1 === matchWords.length) onGameComplete()
      } else {
        setMatchWrong(true)
        saveProgress(matchWords[id].word, false)
        setTimeout(() => { setSelectedWord(null); setSelectedDef(null); setMatchWrong(false) }, 800)
      }
    }
  }

  const handleMatchDef = (id: number) => {
    if (matchedPairs.includes(id)) return
    setSelectedDef(id)
    setMatchWrong(false)

    if (selectedWord !== null) {
      if (selectedWord === id) {
        setMatchedPairs(prev => [...prev, id])
        setMatchScore(prev => prev + 1)
        saveProgress(matchWords[id].word, true)
        setSelectedWord(null)
        setSelectedDef(null)
        if (matchedPairs.length + 1 === matchWords.length) onGameComplete()
      } else {
        setMatchWrong(true)
        saveProgress(matchWords[selectedWord].word, false)
        setTimeout(() => { setSelectedWord(null); setSelectedDef(null); setMatchWrong(false) }, 800)
      }
    }
  }

  // --- FILL IN BLANK ---
  const startFillBlank = async () => {
    const w = await generateWords()
    if (w.length >= 5) {
      const questions = w.slice(0, 5).map((item, i) => {
        const sentence = item.example.replace(new RegExp(item.word, 'gi'), '___')
        // Get unique distractor words (different from the correct answer)
        const distractors = w
          .filter((o, j) => j !== i && o.word.toLowerCase() !== item.word.toLowerCase())
          .map(o => o.word)
          .filter((word, idx, arr) => arr.findIndex(w => w.toLowerCase() === word.toLowerCase()) === idx)
          .slice(0, 3)
        const options = shuffle([item.word, ...distractors])
        return { sentence, answer: item.word, options }
      })
      setFillQuestions(questions)
      setFillIndex(0)
      setFillSelected(null)
      setFillCorrect(null)
      setFillScore(0)
      setMode('fillblank')
    }
    setLoading(false)
  }

  const handleFillAnswer = (option: string) => {
    if (fillCorrect !== null) return
    const correct = option.toLowerCase() === fillQuestions[fillIndex].answer.toLowerCase()
    setFillSelected(option)
    setFillCorrect(correct)
    if (correct) setFillScore(prev => prev + 1)
    saveProgress(fillQuestions[fillIndex].answer, correct)
  }

  const nextFill = () => {
    if (fillIndex < fillQuestions.length - 1) {
      setFillIndex(fillIndex + 1)
      setFillSelected(null)
      setFillCorrect(null)
    } else {
      setMode('menu')
      fetchStats()
      onGameComplete()
    }
  }

  // --- SPELLING BEE ---
  const startSpelling = async () => {
    const w = await generateWords()
    if (w.length > 0) {
      setSpellIndex(0)
      setSpellInput('')
      setSpellResult(null)
      setSpellScore(0)
      setMode('spelling')
    }
    setLoading(false)
  }

  const justCheckedRef = useRef(false)

  const checkSpelling = () => {
    const correct = spellInput.trim().toLowerCase() === words[spellIndex].word.toLowerCase()
    setSpellResult(correct ? 'correct' : 'wrong')
    if (correct) setSpellScore(prev => prev + 1)
    saveProgress(words[spellIndex].word, correct)
    justCheckedRef.current = true
    setTimeout(() => { justCheckedRef.current = false }, 300)
  }

  const nextSpell = () => {
    if (spellIndex < words.length - 1) {
      setSpellIndex(spellIndex + 1)
      setSpellInput('')
      setSpellResult(null)
      setTimeout(() => spellInputRef.current?.focus(), 50)
    } else {
      setMode('menu')
      fetchStats()
      onGameComplete()
    }
  }

  const spellInputRef = useRef<HTMLInputElement>(null)

  // Global keyboard shortcuts for all game modes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Spelling Bee hotkeys
      if (mode === 'spelling' && words.length > 0) {
        const word = words[spellIndex]
        // Ctrl+P or Alt+P → play sound
        if ((e.ctrlKey || e.altKey) && e.key.toLowerCase() === 'p') {
          e.preventDefault()
          speakWord(word.word)
          return
        }
        // Enter → check or next (with guard to prevent skipping feedback)
        if (e.key === 'Enter') {
          e.preventDefault()
          if (spellResult === null && spellInput.trim()) {
            checkSpelling()
          } else if (spellResult !== null && !justCheckedRef.current) {
            nextSpell()
          }
          return
        }
        // Escape → back to menu
        if (e.key === 'Escape') {
          setMode('menu')
          fetchStats()
          return
        }
      }

      // Flashcard quiz hotkeys
      if (mode === 'flashcards' && words.length > 0) {
        // Ctrl+P or Alt+P → play sound
        if ((e.ctrlKey || e.altKey) && e.key.toLowerCase() === 'p') {
          e.preventDefault()
          speakWord(words[flashIndex].word)
          return
        }
        // Enter → check or next
        if (e.key === 'Enter') {
          e.preventDefault()
          if (flashResult === null && flashInput.trim()) {
            checkFlashcard()
          } else if (flashResult !== null && !flashJustCheckedRef.current) {
            nextFlashcard()
          }
          return
        }
        if (e.key === 'Escape') { setMode('menu'); fetchStats() }
      }

      // Fill in blank hotkeys
      if (mode === 'fillblank' && fillQuestions.length > 0) {
        const q = fillQuestions[fillIndex]
        // 1-4 → select option
        if (fillCorrect === null && ['1', '2', '3', '4'].includes(e.key)) {
          const idx = parseInt(e.key) - 1
          if (q.options[idx]) {
            e.preventDefault()
            handleFillAnswer(q.options[idx])
          }
          return
        }
        // Enter → next (after answering)
        if (e.key === 'Enter' && fillCorrect !== null) {
          e.preventDefault()
          nextFill()
          return
        }
        if (e.key === 'Escape') { setMode('menu'); fetchStats() }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [mode, words, spellIndex, spellInput, spellResult, flashIndex, flashInput, flashResult, fillIndex, fillCorrect, fillQuestions])

  const speakWord = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 0.85
    speechSynthesis.speak(utterance)
  }

  if (mode === 'flashcards' && words.length > 0) {
    const word = words[flashIndex]

    return (
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => { setMode('menu'); fetchStats() }} className="text-sm text-gray-500 hover:text-gray-700">{t('backToMenu')}</button>
          <span className="text-sm text-gray-500">{flashIndex + 1} / {words.length}</span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${((flashIndex) / words.length) * 100}%` }} />
        </div>

        {/* Card */}
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 text-center">
          <div className="text-3xl font-bold text-gray-900 mb-2">{word.word}</div>
          <div className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full inline-block mb-3">{word.category}</div>
          <button onClick={() => speakWord(word.word)} className="block mx-auto text-blue-600 hover:text-blue-800 text-2xl mb-4">🔊</button>

          <div className="text-sm text-gray-500 mb-2">{t('typeDefinition')}</div>
          <input
            ref={flashInputRef}
            type="text"
            value={flashInput}
            onChange={e => setFlashInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }}
            placeholder={t('typeYourAnswer')}
            disabled={flashResult !== null}
            className={`w-full text-center text-lg border-2 rounded-xl px-4 py-3 focus:outline-none transition-colors ${
              flashResult === 'correct' ? 'border-green-400 bg-green-50 text-green-700' :
              flashResult === 'wrong' ? 'border-red-400 bg-red-50 text-red-700' :
              'border-gray-200 focus:border-blue-400'
            }`}
            autoFocus
          />

          {flashResult === null ? (
            <button
              onClick={checkFlashcard}
              disabled={!flashInput.trim()}
              className="mt-4 bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-40 font-medium"
            >
              {t('check')} <span className="text-blue-300 text-xs ml-1">Enter</span>
            </button>
          ) : (
            <div className="mt-4 space-y-3">
              {flashResult === 'correct' ? (
                <div className="text-green-600 font-medium">{t('correct')}</div>
              ) : (
                <div className="text-red-600 font-medium">{t('notQuite')}</div>
              )}
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t('definition')}</div>
                <div className="text-gray-800 font-medium">{word.definition}</div>
                <div className="text-sm text-gray-600 italic mt-2 border-l-2 border-blue-300 pl-3">"{word.example}"</div>
              </div>
              <button onClick={nextFlashcard} className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 text-sm">
                {flashIndex < words.length - 1 ? t('next') : t('finish')} <span className="text-blue-300 text-xs ml-1">Enter</span>
              </button>
            </div>
          )}
        </div>

        {/* Hotkey hints */}
        <div className="flex justify-center gap-4 text-xs text-gray-400 mt-3">
          <span>Enter → check/next</span>
          <span>Ctrl+P → listen</span>
          <span>Esc → exit</span>
        </div>
        <div className="text-center text-sm text-gray-500 mt-1">{t('score')}: {flashScore}/{flashIndex + (flashResult ? 1 : 0)}</div>
      </div>
    )
  }

  if (mode === 'match') {
    const defs = shuffledDefs()
    const allMatched = matchedPairs.length === matchWords.length && matchWords.length > 0

    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => { setMode('menu'); fetchStats() }} className="text-sm text-gray-500 hover:text-gray-700">{t('backToMenu')}</button>
          <span className="text-sm text-gray-500">{matchedPairs.length} / {matchWords.length} {t('matched')}</span>
        </div>

        {allMatched ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <div className="text-5xl mb-4">🎉</div>
            <div className="text-xl font-bold text-gray-900 mb-2">{t('allMatched')}</div>
            <div className="text-gray-600 mb-4">{t('matchScore', { score: matchScore, total: matchWords.length })}</div>
            <button onClick={() => { setMode('menu'); fetchStats() }} className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700">{t('backToMenu')}</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {/* Words column */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('words')}</div>
              {matchWords.map(item => (
                <button
                  key={`w-${item.id}`}
                  onClick={() => handleMatchWord(item.id)}
                  disabled={matchedPairs.includes(item.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    matchedPairs.includes(item.id)
                      ? 'bg-green-50 text-green-700 border border-green-200 opacity-60'
                      : selectedWord === item.id
                      ? matchWrong ? 'bg-red-100 border-2 border-red-400 text-red-700 shake' : 'bg-blue-100 border-2 border-blue-400 text-blue-700'
                      : 'bg-white border border-gray-200 text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  {item.word}
                </button>
              ))}
            </div>

            {/* Definitions column */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('definitions')}</div>
              {defs.map(item => (
                <button
                  key={`d-${item.id}`}
                  onClick={() => handleMatchDef(item.id)}
                  disabled={matchedPairs.includes(item.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs leading-relaxed transition-all ${
                    matchedPairs.includes(item.id)
                      ? 'bg-green-50 text-green-700 border border-green-200 opacity-60'
                      : selectedDef === item.id
                      ? matchWrong ? 'bg-red-100 border-2 border-red-400 text-red-700' : 'bg-blue-100 border-2 border-blue-400 text-blue-700'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {item.definition}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (mode === 'fillblank' && fillQuestions.length > 0) {
    const q = fillQuestions[fillIndex]

    return (
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => { setMode('menu'); fetchStats() }} className="text-sm text-gray-500 hover:text-gray-700">{t('backToMenu')}</button>
          <span className="text-sm text-gray-500">{fillIndex + 1} / {fillQuestions.length}</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div className="bg-purple-600 h-2 rounded-full transition-all" style={{ width: `${((fillIndex) / fillQuestions.length) * 100}%` }} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="text-sm text-gray-500 mb-2">{t('completeTheSentence')}</div>
          <div className="text-lg text-gray-800 mb-6 leading-relaxed">
            {q.sentence.split('___').map((part, i) => (
              <span key={i}>
                {part}
                {i < q.sentence.split('___').length - 1 && (
                  <span className={`inline-block min-w-[80px] border-b-2 mx-1 text-center font-bold ${
                    fillCorrect === true ? 'border-green-500 text-green-700' :
                    fillCorrect === false ? 'border-red-500 text-red-700' :
                    'border-gray-300'
                  }`}>
                    {fillSelected || '____'}
                  </span>
                )}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {q.options.map((option, oi) => (
              <button
                key={option}
                onClick={() => handleFillAnswer(option)}
                disabled={fillCorrect !== null}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  fillCorrect !== null && option.toLowerCase() === q.answer.toLowerCase()
                    ? 'bg-green-100 text-green-700 border-2 border-green-400'
                    : fillSelected === option && fillCorrect === false
                    ? 'bg-red-100 text-red-700 border-2 border-red-400'
                    : fillCorrect !== null
                    ? 'bg-gray-50 text-gray-400 border border-gray-200'
                    : 'bg-gray-50 text-gray-800 border border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                }`}
              >
                <span className="text-gray-400 text-xs mr-1.5">{oi + 1}</span> {option}
              </button>
            ))}
          </div>

          {fillCorrect !== null && (
            <div className="mt-4 flex justify-between items-center">
              <span className={`text-sm font-medium ${fillCorrect ? 'text-green-600' : 'text-red-600'}`}>
                {fillCorrect ? t('correct') : t('incorrectAnswer', { answer: q.answer })}
              </span>
              <button onClick={nextFill} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700">
                {fillIndex < fillQuestions.length - 1 ? t('next') : t('finish')}
              </button>
            </div>
          )}
        </div>

        <div className="text-center text-sm text-gray-500 mt-3">{t('score')}: {fillScore}/{fillIndex + (fillCorrect !== null ? 1 : 0)}</div>
      </div>
    )
  }

  if (mode === 'spelling' && words.length > 0) {
    const word = words[spellIndex]

    return (
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => { setMode('menu'); fetchStats() }} className="text-sm text-gray-500 hover:text-gray-700">{t('backToMenu')}</button>
          <span className="text-sm text-gray-500">{spellIndex + 1} / {words.length}</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${((spellIndex) / words.length) * 100}%` }} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
          <div className="text-sm text-gray-500 mb-4">{t('listenAndSpell')}</div>

          <button onClick={() => speakWord(word.word)} className="text-5xl mb-4 hover:scale-110 transition-transform">🔊</button>
          <div className="text-xs text-gray-400 mb-3">Ctrl+P to replay</div>
          <div className="text-sm text-gray-600 mb-1">{t('definition')}:</div>
          <div className="text-gray-800 font-medium mb-6">{word.definition}</div>

          <input
            ref={spellInputRef}
            type="text"
            value={spellInput}
            onChange={e => setSpellInput(e.target.value)}
            onKeyDown={e => {
              // Enter handled by global handler — prevent default to avoid form submit
              if (e.key === 'Enter') e.preventDefault()
            }}
            placeholder={t('typeTheWord')}
            disabled={spellResult !== null}
            className={`w-full text-center text-xl border-2 rounded-xl px-4 py-3 focus:outline-none transition-colors ${
              spellResult === 'correct' ? 'border-green-400 bg-green-50 text-green-700' :
              spellResult === 'wrong' ? 'border-red-400 bg-red-50 text-red-700' :
              'border-gray-200 focus:border-blue-400'
            }`}
            autoFocus
          />

          {spellResult === null ? (
            <button
              onClick={checkSpelling}
              disabled={!spellInput.trim()}
              className="mt-4 bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-40 font-medium"
            >
              {t('check')} <span className="text-blue-300 text-xs ml-1">Enter ↵</span>
            </button>
          ) : (
            <div className="mt-4 space-y-3">
              {spellResult === 'wrong' && (
                <div className="text-red-600 text-sm font-medium">{t('correctSpelling')}: <strong>{word.word}</strong></div>
              )}
              {spellResult === 'correct' && (
                <div className="text-green-600 text-sm font-medium">{t('perfectSpelling')}</div>
              )}
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t('exampleUsage')}</div>
                <div className="text-sm text-gray-800 italic border-l-2 border-orange-300 pl-3">"{word.example}"</div>
              </div>
              <button onClick={nextSpell} className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 text-sm">
                {spellIndex < words.length - 1 ? t('next') : t('finish')} <span className="text-blue-300 text-xs ml-1">Enter ↵</span>
              </button>
            </div>
          )}
        </div>

        {/* Hotkey hints */}
        <div className="flex justify-center gap-4 text-xs text-gray-400 mt-3">
          <span>Enter → check/next</span>
          <span>Ctrl+P → replay</span>
          <span>Esc → exit</span>
        </div>
        <div className="text-center text-sm text-gray-500 mt-1">{t('score')}: {spellScore}/{spellIndex + (spellResult ? 1 : 0)}</div>
      </div>
    )
  }

  // --- MAIN MENU ---
  return (
    <div className="space-y-6">
      <MilestoneProgress skill="vocabulary" />
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-xs text-gray-500">{t('totalWords')}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.mastered}</div>
          <div className="text-xs text-gray-500">{t('mastered')}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.learning}</div>
          <div className="text-xs text-gray-500">{t('learning')}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-600">{stats.new_words}</div>
          <div className="text-xs text-gray-500">{t('newWords')}</div>
        </div>
      </div>

      {/* Category selector */}
      <div>
        <div className="text-sm font-medium text-gray-700 mb-2">{t('chooseCategory')}</div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                category === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Game modes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={startFlashcards}
          disabled={loading}
          className="bg-white border-2 border-gray-200 rounded-2xl p-6 text-left hover:border-blue-300 hover:shadow-md transition-all group disabled:opacity-50"
        >
          <div className="text-3xl mb-3">🃏</div>
          <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{t('flashcards')}</div>
          <div className="text-sm text-gray-500 mt-1">{t('flashcardsDesc')}</div>
        </button>

        <button
          onClick={startMatch}
          disabled={loading}
          className="bg-white border-2 border-gray-200 rounded-2xl p-6 text-left hover:border-purple-300 hover:shadow-md transition-all group disabled:opacity-50"
        >
          <div className="text-3xl mb-3">🔗</div>
          <div className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors">{t('wordMatch')}</div>
          <div className="text-sm text-gray-500 mt-1">{t('wordMatchDesc')}</div>
        </button>

        <button
          onClick={startFillBlank}
          disabled={loading}
          className="bg-white border-2 border-gray-200 rounded-2xl p-6 text-left hover:border-green-300 hover:shadow-md transition-all group disabled:opacity-50"
        >
          <div className="text-3xl mb-3">✏️</div>
          <div className="font-bold text-gray-900 group-hover:text-green-600 transition-colors">{t('fillInBlank')}</div>
          <div className="text-sm text-gray-500 mt-1">{t('fillInBlankDesc')}</div>
        </button>

        <button
          onClick={startSpelling}
          disabled={loading}
          className="bg-white border-2 border-gray-200 rounded-2xl p-6 text-left hover:border-orange-300 hover:shadow-md transition-all group disabled:opacity-50"
        >
          <div className="text-3xl mb-3">🐝</div>
          <div className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{t('spellingBee')}</div>
          <div className="text-sm text-gray-500 mt-1">{t('spellingBeeDesc')}</div>
        </button>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 text-gray-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            {t('generatingWords')}
          </div>
        </div>
      )}

      {showPaywall && <SubscriptionPaywall />}

      {error && !showPaywall && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600 font-bold">×</button>
        </div>
      )}

      {/* Word bank (learned words) */}
      {userWords.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">{t('yourWordBank')}</div>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 max-h-64 overflow-y-auto">
            {userWords.slice(0, 20).map(w => (
              <div key={w.id} className="px-4 py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-800 text-sm">{w.word}</span>
                  <span className="text-xs text-gray-500 ml-2">{w.definition}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    w.mastery >= 3 ? 'bg-green-100 text-green-700' :
                    w.mastery >= 1 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {w.mastery >= 3 ? t('mastered') : w.mastery >= 1 ? t('learning') : t('new')}
                  </span>
                  <button onClick={() => speakWord(w.word)} className="text-blue-500 hover:text-blue-700">🔊</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
