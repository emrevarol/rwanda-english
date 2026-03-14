'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Navigation from '@/components/shared/Navigation'
import SubscriptionPaywall from '@/components/shared/SubscriptionPaywall'
import { markDailyTaskDone } from '@/lib/dailyComplete'

interface Question {
  type: 'fill-blank' | 'error-correction' | 'multiple-choice' | 'sentence-reorder'
  sentence?: string
  words?: string[]
  corrected?: string
  answer: string
  options?: string[]
  explanation: string
}

const TOPICS = [
  'general', 'tenses', 'articles', 'prepositions', 'conditionals',
  'passive', 'relative', 'modals', 'reported',
] as const

const TOPIC_KEYS: Record<string, string> = {
  general: 'topicGeneral',
  tenses: 'topicTenses',
  articles: 'topicArticles',
  prepositions: 'topicPrepositions',
  conditionals: 'topicConditionals',
  passive: 'topicPassive',
  relative: 'topicRelative',
  modals: 'topicModals',
  reported: 'topicReported',
}

const TYPE_KEYS: Record<string, string> = {
  'fill-blank': 'fillBlank',
  'error-correction': 'errorCorrection',
  'multiple-choice': 'multipleChoice',
  'sentence-reorder': 'sentenceReorder',
}

const TYPE_ICONS: Record<string, string> = {
  'fill-blank': '___',
  'error-correction': 'abc',
  'multiple-choice': 'A/B',
  'sentence-reorder': '1-2',
}

const JOKERS_PER_EXERCISE = 3

export default function GrammarPage() {
  const t = useTranslations('grammar')
  const { status } = useSession()
  const [topic, setTopic] = useState<string>('general')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [selectedOptIdx, setSelectedOptIdx] = useState<number>(-1)
  const [reorderWords, setReorderWords] = useState<string[]>([])
  const [checked, setChecked] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [score, setScore] = useState(0)
  const [totalAnswered, setTotalAnswered] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPaywall, setShowPaywall] = useState(false)
  const [finished, setFinished] = useState(false)
  const [timer, setTimer] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [jokersLeft, setJokersLeft] = useState(JOKERS_PER_EXERCISE)
  const [jokerUsed, setJokerUsed] = useState(false)
  const [jokersUsedTotal, setJokersUsedTotal] = useState(0)

  // Timer
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timerRunning])

  const generate = async () => {
    setLoading(true)
    setError('')
    setQuestions([])
    setCurrentIdx(0)
    setScore(0)
    setTotalAnswered(0)
    setFinished(false)
    setChecked(false)
    setUserAnswer('')
    setReorderWords([])
    setTimer(0)
    setJokersLeft(JOKERS_PER_EXERCISE)
    setJokerUsed(false)
    setJokersUsedTotal(0)

    try {
      const res = await fetch(`/api/grammar/generate?topic=${topic}`)
      const data = await res.json()
      if (data.code === 'SUBSCRIPTION_REQUIRED') {
        setShowPaywall(true)
      } else if (!res.ok || data.error) {
        setError(data.error || t('errorGenerate'))
      } else {
        setQuestions(data.questions || [])
        setTimerRunning(true)
        // Initialize reorder if first question is reorder type
        if (data.questions?.[0]?.type === 'sentence-reorder' && data.questions[0].words) {
          setReorderWords([...data.questions[0].words].sort(() => Math.random() - 0.5))
        }
      }
    } catch {
      setError(t('errorConnection'))
    }
    setLoading(false)
  }

  const currentQ = questions[currentIdx]

  const useJoker = () => {
    if (!currentQ || checked || jokersLeft <= 0 || jokerUsed) return

    if (currentQ.type === 'sentence-reorder') {
      // Place the next correct word in the answer
      const answerWords = currentQ.answer.replace(/[.!?,;:'"]/g, '').split(/\s+/)
      const currentWords = userAnswer ? userAnswer.split(' ') : []
      const nextWordIdx = currentWords.length
      if (nextWordIdx < answerWords.length) {
        const nextWord = answerWords[nextWordIdx]
        // Find the word in available pool (case-insensitive match)
        const poolIdx = reorderWords.findIndex(w =>
          w.toLowerCase().replace(/[.!?,;:'"]/g, '') === nextWord.toLowerCase()
        )
        if (poolIdx !== -1) {
          const word = reorderWords[poolIdx]
          setReorderWords(prev => prev.filter((_, i) => i !== poolIdx))
          setUserAnswer(prev => (prev ? prev + ' ' + word : word))
        }
      }
    } else if (currentQ.type === 'fill-blank' || currentQ.type === 'multiple-choice') {
      // Reveal the answer
      setUserAnswer(currentQ.answer)
      if (currentQ.options) {
        const optIdx = currentQ.options.findIndex(o => o.toLowerCase() === currentQ.answer.toLowerCase())
        if (optIdx !== -1) setSelectedOptIdx(optIdx)
      }
    } else if (currentQ.type === 'error-correction') {
      // Show first few characters as hint
      const corrected = currentQ.corrected || currentQ.answer
      const hintLen = Math.min(Math.ceil(corrected.length * 0.4), 20)
      setUserAnswer(corrected.slice(0, hintLen) + '...')
    }

    setJokersLeft(j => j - 1)
    setJokerUsed(true)
    setJokersUsedTotal(j => j + 1)
  }

  const checkAnswer = () => {
    if (!currentQ || checked) return

    let correct = false
    if (currentQ.type === 'error-correction') {
      const normalize = (s: string) => s.toLowerCase().replace(/[.!?,;:'"]/g, '').replace(/\s+/g, ' ').trim()
      correct = normalize(userAnswer) === normalize(currentQ.corrected || '')
    } else if (currentQ.type === 'sentence-reorder') {
      const normalize = (s: string) => s.toLowerCase().replace(/[.!?,;:'"]/g, '').replace(/\s+/g, ' ').trim()
      const joined = userAnswer || reorderWords.join(' ')
      correct = normalize(joined) === normalize(currentQ.answer)
    } else {
      correct = userAnswer.trim().toLowerCase() === currentQ.answer.trim().toLowerCase()
    }

    setIsCorrect(correct)
    if (correct) setScore(s => s + 1)
    setTotalAnswered(n => n + 1)
    setChecked(true)
  }

  const nextQuestion = () => {
    if (currentIdx + 1 >= questions.length) {
      setFinished(true)
      setTimerRunning(false)
      markDailyTaskDone('grammar', Math.round(timer / 60))
      // Save grammar session
      fetch('/api/grammar/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, total: totalAnswered + (checked ? 0 : 1), mins: Math.round(timer / 60) }),
      }).catch(() => {})
      return
    }
    const nextIdx = currentIdx + 1
    setCurrentIdx(nextIdx)
    setChecked(false)
    setIsCorrect(false)
    setUserAnswer('')
    setSelectedOptIdx(-1)
    setJokerUsed(false)
    // Initialize reorder words for next question
    if (questions[nextIdx]?.type === 'sentence-reorder' && questions[nextIdx].words) {
      setReorderWords([...questions[nextIdx].words!].sort(() => Math.random() - 0.5))
    } else {
      setReorderWords([])
    }
  }

  const moveWord = (idx: number) => {
    if (checked) return
    const word = reorderWords[idx]
    setReorderWords(prev => prev.filter((_, i) => i !== idx))
    setUserAnswer(prev => (prev ? prev + ' ' + word : word))
  }

  const removeFromAnswer = (idx: number) => {
    if (checked) return
    const words = userAnswer.split(' ')
    const removed = words.splice(idx, 1)[0]
    setUserAnswer(words.join(' '))
    setReorderWords(prev => [...prev, removed])
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Please login to access grammar practice.</p>
      </div>
    )
  }

  if (showPaywall) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-16"><SubscriptionPaywall /></div>
      </div>
    )
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('subtitle')}</p>
        </div>

        {/* Topic selection + generate */}
        {questions.length === 0 && !finished && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('topic')}</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {TOPICS.map(tp => (
                  <button
                    key={tp}
                    onClick={() => setTopic(tp)}
                    className={`text-xs px-3 py-2 rounded-lg border transition-colors ${topic === tp
                      ? 'bg-pink-50 border-pink-300 text-pink-700 font-semibold'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {t(TOPIC_KEYS[tp])}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generate}
              disabled={loading}
              className="w-full text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#d4798a' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#c06b7c')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#d4798a')}
            >
              {loading ? t('generating') : t('startExercise')}
            </button>

            {error && (
              <div className="bg-pink-50 border border-pink-200 rounded-lg px-4 py-3 text-sm text-pink-700">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Exercise in progress */}
        {currentQ && !finished && (
          <div className="space-y-4">
            {/* Progress bar + joker counter */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-600">
                  {currentIdx + 1} / {questions.length}
                </span>
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${((currentIdx + 1) / questions.length) * 100}%`, backgroundColor: '#d4798a' }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-green-600 font-semibold">{score} / {totalAnswered}</span>
                <span className="text-gray-400 font-mono">{formatTime(timer)}</span>
              </div>
            </div>

            {/* Question card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              {/* Type badge + Joker button */}
              <div className="flex items-center justify-between">
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: '#fce4ec', color: '#c06b7c' }}>
                  {TYPE_ICONS[currentQ.type]} {t(TYPE_KEYS[currentQ.type])}
                </span>
                {!checked && jokersLeft > 0 && (
                  <button
                    onClick={useJoker}
                    disabled={jokerUsed}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                      jokerUsed
                        ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100 hover:shadow-sm'
                    }`}
                    title={t('jokerTooltip')}
                  >
                    <span className="text-base">🃏</span>
                    {jokerUsed ? t('jokerUsedLabel') : t('jokerLabel')}
                    <span className="bg-amber-200 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-0.5">
                      {jokersLeft}
                    </span>
                  </button>
                )}
                {!checked && jokersLeft === 0 && (
                  <span className="text-xs text-gray-400">{t('noJokersLeft')}</span>
                )}
              </div>

              {/* Question content based on type */}
              {currentQ.type === 'fill-blank' && (
                <div className="space-y-4">
                  <p className="text-lg text-gray-800 leading-relaxed">
                    {currentQ.sentence?.split('___').map((part, i, arr) => (
                      <span key={i}>
                        {part}
                        {i < arr.length - 1 && (
                          <span className="inline-block mx-1 border-b-2 min-w-[80px] text-center font-semibold" style={{ borderColor: '#d4798a', color: '#c06b7c' }}>
                            {checked ? currentQ.answer : userAnswer || '___'}
                          </span>
                        )}
                      </span>
                    ))}
                  </p>
                  {currentQ.options && !checked && (
                    <div className="grid grid-cols-2 gap-2">
                      {currentQ.options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => { setUserAnswer(opt); setSelectedOptIdx(i) }}
                          className={`text-sm px-4 py-2.5 rounded-lg border transition-colors ${selectedOptIdx === i
                            ? 'bg-pink-50 border-pink-300 text-pink-700 font-semibold'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {currentQ.type === 'multiple-choice' && (
                <div className="space-y-4">
                  <p className="text-lg text-gray-800 leading-relaxed">
                    {currentQ.sentence?.split('___').map((part, i, arr) => (
                      <span key={i}>
                        {part}
                        {i < arr.length - 1 && (
                          <span className="inline-block mx-1 border-b-2 min-w-[80px] text-center font-semibold" style={{ borderColor: '#d4798a', color: '#c06b7c' }}>
                            {checked ? currentQ.answer : userAnswer || '___'}
                          </span>
                        )}
                      </span>
                    ))}
                  </p>
                  {currentQ.options && !checked && (
                    <div className="grid grid-cols-2 gap-2">
                      {currentQ.options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => { setUserAnswer(opt); setSelectedOptIdx(i) }}
                          className={`text-sm px-4 py-2.5 rounded-lg border transition-colors ${selectedOptIdx === i
                            ? 'bg-pink-50 border-pink-300 text-pink-700 font-semibold'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {currentQ.type === 'error-correction' && (
                <div className="space-y-4">
                  <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                    <p className="text-sm font-medium mb-1" style={{ color: '#c06b7c' }}>Find and fix the error:</p>
                    <p className="text-lg text-gray-800">{currentQ.sentence}</p>
                  </div>
                  {!checked && (
                    <input
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Type the corrected sentence..."
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': '#d4798a' } as React.CSSProperties}
                    />
                  )}
                </div>
              )}

              {currentQ.type === 'sentence-reorder' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 font-medium">Arrange the words in the correct order:</p>

                  {/* Built sentence */}
                  <div className="min-h-[48px] bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-3 flex flex-wrap gap-2">
                    {userAnswer ? userAnswer.split(' ').map((w, i) => (
                      <button
                        key={i}
                        onClick={() => removeFromAnswer(i)}
                        disabled={checked}
                        className="text-sm px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-70"
                        style={{ backgroundColor: '#fce4ec', color: '#c06b7c' }}
                      >
                        {w}
                      </button>
                    )) : <span className="text-gray-400 text-sm">Tap words below to build the sentence...</span>}
                  </div>

                  {/* Available words */}
                  {!checked && (
                    <div className="flex flex-wrap gap-2">
                      {reorderWords.map((w, i) => (
                        <button
                          key={i}
                          onClick={() => moveWord(i)}
                          className="text-sm bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Feedback after checking */}
              {checked && (
                <div className={`rounded-lg p-4 ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{isCorrect ? '✅' : '❌'}</span>
                    <span className={`font-semibold ${isCorrect ? 'text-green-700' : 'text-amber-700'}`}>
                      {isCorrect ? t('correct') : t('incorrect')}
                    </span>
                  </div>
                  {!isCorrect && currentQ.type === 'error-correction' && (
                    <p className="text-sm text-gray-700 mb-2">
                      <span className="font-medium">Correct:</span> {currentQ.corrected}
                    </p>
                  )}
                  {!isCorrect && currentQ.type === 'sentence-reorder' && (
                    <p className="text-sm text-gray-700 mb-2">
                      <span className="font-medium">Correct:</span> {currentQ.answer}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{t('explanation')}:</span> {currentQ.explanation}
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                {!checked ? (
                  <button
                    onClick={checkAnswer}
                    disabled={!userAnswer.trim()}
                    className="flex-1 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                    style={{ backgroundColor: '#d4798a' }}
                    onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#c06b7c' }}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#d4798a')}
                  >
                    {t('checkAnswer')}
                  </button>
                ) : (
                  <button
                    onClick={nextQuestion}
                    className="flex-1 text-white py-3 rounded-xl font-medium transition-colors"
                    style={{ backgroundColor: '#d4798a' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#c06b7c')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#d4798a')}
                  >
                    {currentIdx + 1 >= questions.length ? t('exerciseComplete') : t('nextQuestion')}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Exercise complete */}
        {finished && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center space-y-5">
            <div className="text-5xl">🎉</div>
            <h2 className="text-xl font-bold text-gray-900">{t('exerciseComplete')}</h2>
            <div className="flex justify-center gap-8">
              <div>
                <div className="text-3xl font-bold" style={{ color: '#d4798a' }}>{score}/{totalAnswered}</div>
                <div className="text-xs text-gray-500">{t('score')}</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-700">{Math.round((score / totalAnswered) * 100)}%</div>
                <div className="text-xs text-gray-500">Accuracy</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-500">{formatTime(timer)}</div>
                <div className="text-xs text-gray-500">Time</div>
              </div>
            </div>
            {jokersUsedTotal > 0 && (
              <p className="text-sm text-amber-600">🃏 {t('jokersUsedCount', { count: jokersUsedTotal })}</p>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={generate}
                className="text-white px-6 py-3 rounded-xl font-medium transition-colors"
                style={{ backgroundColor: '#d4798a' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#c06b7c')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#d4798a')}
              >
                {t('newExercise')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
