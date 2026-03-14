'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { getWritingPrompt } from '@/lib/helpers'
import { markDailyTaskDone } from '@/lib/dailyComplete'
import SampleChart from './SampleChart'
import SubscriptionPaywall from '@/components/shared/SubscriptionPaywall'
import MilestoneProgress from '@/components/shared/MilestoneProgress'

interface Feedback {
  band: number
  taskAchievement: string
  coherence: string
  vocabulary: string
  grammar: string
  improvedSentences: string[]
  overallFeedback: string
}

export default function WritingEditor({
  taskType,
  level,
}: {
  taskType: 'task1' | 'task2'
  level: string
}) {
  const t = useTranslations('writing')
  const [prompt, setPrompt] = useState('')
  const [text, setText] = useState('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPaywall, setShowPaywall] = useState(false)
  const [timer, setTimer] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Timer: starts when user begins typing, pauses on page hide
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timerActive])

  useEffect(() => {
    const onVis = () => { if (document.hidden) setTimerActive(false); else if (text.length > 0 && !feedback) setTimerActive(true) }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [text, feedback])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  const generatePrompt = useCallback(async () => {
    setText('')
    setFeedback(null)
    setError('')
    setTimer(0)
    setTimerActive(false)
    try {
      const res = await fetch(`/api/content/writing-prompt?taskType=${taskType}`)
      const data = await res.json()
      setPrompt(data.prompt || getWritingPrompt(taskType, level))
    } catch {
      // Fallback to hardcoded
      setPrompt(getWritingPrompt(taskType, level))
    }
  }, [taskType, level])

  useEffect(() => {
    generatePrompt()
  }, [generatePrompt])

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

  const handleSubmit = async () => {
    if (!text.trim() || text.trim().length < 20) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/writing/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, prompt, taskType }),
      })
      const data = await res.json()
      if (data.code === 'SUBSCRIPTION_REQUIRED') {
        setShowPaywall(true)
      } else if (!res.ok || data.error) {
        setError(data.error || 'Failed to get feedback. Please try again.')
      } else {
        setFeedback(data)
        setTimerActive(false)
        markDailyTaskDone(taskType === 'task1' ? 'writing-chart' : 'writing-essay', Math.round(timer / 60))
      }
    } catch {
      setError('Connection error. Please check your internet and try again.')
    }
    setLoading(false)
  }

  const bandColor = (band: number) => {
    if (band >= 7) return 'text-green-600'
    if (band >= 5) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-4">
      <MilestoneProgress skill="writing" />
      {/* Prompt */}
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-medium text-sky-600 uppercase tracking-wide mb-1">
              {t('prompt')}
            </div>
            <p className="text-gray-800 text-sm leading-relaxed">{prompt}</p>
          </div>
          <button
            onClick={generatePrompt}
            className="flex-shrink-0 text-xs bg-sky-600 text-white px-3 py-1.5 rounded-lg hover:bg-sky-700 transition-colors"
          >
            {t('newTask')}
          </button>
        </div>
      </div>

      {/* Sample chart for Task 1 */}
      {taskType === 'task1' && prompt && <SampleChart prompt={prompt} />}

      {/* Editor */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); if (!timerActive && !feedback) setTimerActive(true) }}
          placeholder={t('placeholder')}
          rows={10}
          className="w-full text-sm text-gray-800 focus:outline-none resize-none leading-relaxed"
        />
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-600">{wordCount} {t('wordCount')}</span>
            {(timerActive || timer > 0) && (
              <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">
                {formatTime(timer)}
              </span>
            )}
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || wordCount < 5}
            className="bg-sky-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('submitting') : t('submit')}
          </button>
        </div>
      </div>

      {/* Paywall */}
      {showPaywall && <SubscriptionPaywall />}

      {/* Error */}
      {error && !showPaywall && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600 font-bold">×</button>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{t('feedback.title')}</h3>
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-0.5">{t('feedback.band')}</div>
              <div className={`text-3xl font-bold ${bandColor(feedback.band)}`}>
                {feedback.band}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FeedbackSection title={t('feedback.taskAchievement')} content={feedback.taskAchievement} color="blue" />
            <FeedbackSection title={t('feedback.coherence')} content={feedback.coherence} color="purple" />
            <FeedbackSection title={t('feedback.vocabulary')} content={feedback.vocabulary} color="green" />
            <FeedbackSection title={t('feedback.grammar')} content={feedback.grammar} color="orange" />
          </div>

          {feedback.improvedSentences?.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm font-semibold text-green-800 mb-2">
                ✨ {t('feedback.improved')}
              </div>
              <ul className="space-y-2">
                {feedback.improvedSentences.map((sentence, i) => (
                  <li key={i} className="text-sm text-green-700 italic">
                    "{sentence}"
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-slate-100 border border-slate-200 rounded-lg p-4">
            <div className="text-sm font-semibold text-slate-800 mb-1">{t('feedback.overall')}</div>
            <p className="text-sm text-slate-700 leading-relaxed">{feedback.overallFeedback}</p>
          </div>

          <button
            onClick={generatePrompt}
            className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            {t('newTask')}
          </button>
        </div>
      )}
    </div>
  )
}

function FeedbackSection({
  title,
  content,
  color,
}: {
  title: string
  content: string
  color: string
}) {
  const colors: Record<string, { bg: string; title: string; body: string }> = {
    blue: { bg: 'bg-blue-50 border-blue-200', title: 'text-blue-700', body: 'text-blue-900' },
    purple: { bg: 'bg-purple-50 border-purple-200', title: 'text-purple-700', body: 'text-purple-900' },
    green: { bg: 'bg-green-50 border-green-200', title: 'text-green-700', body: 'text-green-900' },
    orange: { bg: 'bg-orange-50 border-orange-200', title: 'text-orange-700', body: 'text-orange-900' },
  }

  const c = colors[color] || colors.blue

  return (
    <div className={`p-3 rounded-lg border ${c.bg}`}>
      <div className={`text-xs font-semibold uppercase tracking-wide mb-1 ${c.title}`}>{title}</div>
      <p className={`text-sm leading-relaxed ${c.body}`}>{content}</p>
    </div>
  )
}
