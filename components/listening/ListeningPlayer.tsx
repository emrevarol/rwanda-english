'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { markDailyTaskDone } from '@/lib/dailyComplete'
import SubscriptionPaywall from '@/components/shared/SubscriptionPaywall'

interface Question {
  question: string
  options: string[]
  correct: number
  explanation: string
}

interface Content {
  passage: string
  questions: Question[]
}

// Pick the most natural English voice available
function getBestVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  const english = voices.filter(v => v.lang.startsWith('en'))

  // Prefer premium/natural voices (these names vary by OS)
  const preferred = [
    'Samantha', // macOS - very natural
    'Karen',    // macOS Australian
    'Daniel',   // macOS British
    'Google UK English Female',
    'Google UK English Male',
    'Google US English',
    'Microsoft Zira',
    'Microsoft David',
  ]

  for (const name of preferred) {
    const match = english.find(v => v.name.includes(name))
    if (match) return match
  }

  // Fallback: any English voice, prefer non-compact
  const nonCompact = english.filter(v => !v.name.includes('Compact'))
  return nonCompact[0] || english[0] || null
}

const FREE_PLAYS = 2
const PENALTY_PER_EXTRA = 10

const TOPICS = [
  { key: 'topicGeneral', value: 'general' },
  { key: 'topicBusiness', value: 'business' },
  { key: 'topicTechnology', value: 'technology' },
  { key: 'topicTravel', value: 'travel' },
  { key: 'topicScience', value: 'science' },
  { key: 'topicCulture', value: 'culture' },
  { key: 'topicHealth', value: 'health' },
  { key: 'topicEducation', value: 'education' },
]

export default function ListeningPlayer({ locale }: { locale?: string }) {
  const t = useTranslations('listening')
  const router = useRouter()

  // Topic selection
  const [selectedTopic, setSelectedTopic] = useState('general')

  // Content state
  const [content, setContent] = useState<Content | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPaywall, setShowPaywall] = useState(false)

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false)
  const [playsUsed, setPlaysUsed] = useState(0)

  // Answers state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [extraPlays, setExtraPlays] = useState(0)

  // Notes state
  const [notes, setNotes] = useState('')

  // Timer state
  const [elapsed, setElapsed] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Voice
  const [voicesLoaded, setVoicesLoaded] = useState(false)

  // Load voices (they load async in some browsers)
  useEffect(() => {
    const loadVoices = () => {
      if (window.speechSynthesis.getVoices().length > 0) {
        setVoicesLoaded(true)
      }
    }
    loadVoices()
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
    }
  }, [])

  // Timer logic
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setElapsed(prev => prev + 1)
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [timerRunning])

  // Pause timer when page is hidden, resume when visible
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setTimerRunning(false)
        // Also stop audio if playing
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel()
          setIsPlaying(false)
        }
      } else if (content && !submitted) {
        setTimerRunning(true)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [content, submitted])

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }, [])

  const generate = async () => {
    setLoading(true)
    setContent(null)
    setSelectedAnswers({})
    setSubmitted(false)
    setScore(null)
    setError('')
    setPlaysUsed(0)
    setExtraPlays(0)
    setNotes('')
    setElapsed(0)
    setTimerRunning(false)

    try {
      const res = await fetch(`/api/listening/generate?topic=${selectedTopic}`)
      const data = await res.json()
      if (data.code === 'SUBSCRIPTION_REQUIRED') {
        setShowPaywall(true)
      } else if (!res.ok || data.error) {
        setError(data.detail || data.error || t('errorGenerate'))
      } else {
        setContent(data)
        setTimerRunning(true)
      }
    } catch {
      setError(t('errorConnection'))
    }
    setLoading(false)
  }

  const playPassage = () => {
    if (!content) return

    // Stop if currently playing
    if (isPlaying) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
      return
    }

    // Check play limits
    const totalAllowed = FREE_PLAYS + extraPlays
    if (playsUsed >= totalAllowed) return

    // Update play count BEFORE starting (user sees remaining count drop immediately)
    setPlaysUsed(prev => prev + 1)

    const utterance = new SpeechSynthesisUtterance(content.passage)
    utterance.lang = 'en-US'
    utterance.rate = 0.88
    utterance.pitch = 1.0

    // Use best available voice
    if (voicesLoaded) {
      const voice = getBestVoice()
      if (voice) utterance.voice = voice
    }

    utterance.onend = () => {
      setIsPlaying(false)
    }
    utterance.onerror = () => {
      setIsPlaying(false)
    }

    window.speechSynthesis.speak(utterance)
    setIsPlaying(true)
  }

  const buyExtraPlay = () => {
    setExtraPlays(prev => prev + 1)
  }

  const handleSubmit = async () => {
    if (!content) return

    let correct = 0
    content.questions.forEach((q, i) => {
      if (selectedAnswers[i] === q.correct) correct++
    })

    let pct = Math.round((correct / content.questions.length) * 100)

    // Apply penalty for extra listens
    const penalty = extraPlays * PENALTY_PER_EXTRA
    if (penalty > 0) {
      pct = Math.max(0, pct - penalty)
    }

    setScore(pct)
    setSubmitted(true)
    setTimerRunning(false)

    await fetch('/api/listening/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passage: content.passage,
        score: pct,
        timeSpent: elapsed,
        playsUsed: playsUsed,
        extraPlays,
      }),
    })

    // Auto-mark daily plan task as done
    markDailyTaskDone('listening', Math.round(elapsed / 60))
  }

  const answeredAll = content ? Object.keys(selectedAnswers).length === content.questions.length : false
  const totalAllowed = FREE_PLAYS + extraPlays
  const playsRemaining = Math.max(0, totalAllowed - playsUsed)
  const canPlay = playsRemaining > 0

  return (
    <div className="space-y-4">
      {/* Generate button */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
        <div className="text-4xl mb-4">🎧</div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('title')}</h2>
        <p className="text-gray-500 text-sm mb-6">
          {t('playerDesc')}
        </p>
        {/* Topic selector */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {TOPICS.map((topic) => (
            <button
              key={topic.value}
              onClick={() => setSelectedTopic(topic.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedTopic === topic.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t(topic.key)}
            </button>
          ))}
        </div>

        <button
          onClick={generate}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? t('generating') : t('generate')}
        </button>
        {showPaywall && <SubscriptionPaywall />}
        {error && !showPaywall && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <span>⚠️</span> {error}
            <button onClick={() => setError('')} className="ml-auto font-bold text-red-400 hover:text-red-600">×</button>
          </div>
        )}
      </div>

      {content && (
        <>
          {/* Timer bar */}
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>⏱</span>
              <span className="font-mono font-medium text-gray-900">{formatTime(elapsed)}</span>
            </div>
            <div className="flex items-center gap-4">
              {/* Plays indicator */}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalAllowed }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      i < playsUsed
                        ? 'bg-gray-300'
                        : i < FREE_PLAYS
                        ? 'bg-blue-500'
                        : 'bg-amber-400'
                    }`}
                    title={i < FREE_PLAYS ? 'Free listen' : 'Extra listen (penalty)'}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">
                {t('playsRemaining', { count: playsRemaining })}
              </span>
            </div>
          </div>

          {/* Audio player (NO text shown!) */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex flex-col items-center gap-4">
              {playsUsed === 0 && (
                <p className="text-sm text-gray-500 text-center">
                  {t('readyToListen')}
                </p>
              )}

              {/* Last listen warning */}
              {playsRemaining === 1 && !isPlaying && (
                <p className="text-xs text-amber-600 font-medium">
                  {t('lastListen')}
                </p>
              )}

              {/* Big play button */}
              <button
                onClick={playPassage}
                disabled={!canPlay && !isPlaying}
                className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all shadow-lg ${
                  isPlaying
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                    : canPlay
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isPlaying ? '⏹' : '▶'}
              </button>

              {isPlaying && (
                <p className="text-sm text-blue-600 font-medium animate-pulse">
                  {t('listening')}
                </p>
              )}

              {/* Extra listen button */}
              {!canPlay && !submitted && (
                <button
                  onClick={buyExtraPlay}
                  className="text-sm px-4 py-2 rounded-lg border-2 border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                >
                  {t('extraPlay')}
                </button>
              )}

              {extraPlays > 0 && !submitted && (
                <p className="text-xs text-amber-600">
                  {t('penaltyApplied', { penalty: extraPlays * PENALTY_PER_EXTRA })}
                </p>
              )}
            </div>
          </div>

          {/* Notes area */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span>📝</span> {t('notes')}
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('notesPlaceholder')}
              disabled={submitted}
              className="w-full h-28 px-4 py-3 rounded-lg border border-gray-200 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          {/* Questions — visible from the start */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              {t('questions')}
            </h3>
            <div className="space-y-6">
              {content.questions.map((q, qi) => (
                <div key={qi}>
                  <p className="text-sm font-medium text-gray-900 mb-3">
                    {qi + 1}. {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => {
                      const isSelected = selectedAnswers[qi] === oi
                      const isCorrect = submitted && oi === q.correct
                      const isWrong = submitted && isSelected && oi !== q.correct

                      return (
                        <button
                          key={oi}
                          onClick={() => !submitted && setSelectedAnswers({ ...selectedAnswers, [qi]: oi })}
                          disabled={submitted}
                          className={`w-full text-left px-4 py-2.5 rounded-lg border-2 text-sm transition-all ${
                            isCorrect
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : isWrong
                              ? 'border-red-400 bg-red-50 text-red-700'
                              : isSelected
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <span className="font-medium mr-2">{String.fromCharCode(65 + oi)}.</span>
                          {opt}
                          {isCorrect && ' ✓'}
                          {isWrong && ' ✗'}
                        </button>
                      )
                    })}
                  </div>
                  {submitted && (
                    <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                      <span className="font-medium">{t('explanation')}:</span> {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {!submitted ? (
              <button
                onClick={handleSubmit}
                disabled={!answeredAll}
                className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {t('submit')}
              </button>
            ) : (
              <div className="mt-6 text-center bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="text-sm text-gray-500 mb-1">{t('result')}</div>
                <div className={`text-4xl font-bold ${score! >= 70 ? 'text-green-600' : score! >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {score}%
                </div>
                {extraPlays > 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    {t('penaltyApplied', { penalty: extraPlays * PENALTY_PER_EXTRA })}
                  </p>
                )}
                <div className="text-xs text-gray-400 mt-2">
                  ⏱ {formatTime(elapsed)}
                </div>
                <div className="flex gap-3 justify-center mt-4">
                  <button
                    onClick={() => router.push(`/${locale || 'en'}/learning-path`)}
                    className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    {t('backToPlan')}
                  </button>
                  <button
                    onClick={generate}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    {t('generate')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
