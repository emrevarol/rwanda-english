'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { getWritingPrompt } from '@/lib/helpers'

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

  const generatePrompt = () => {
    setPrompt(getWritingPrompt(taskType, level))
    setText('')
    setFeedback(null)
    setError('')
  }

  useEffect(() => {
    generatePrompt()
  }, [taskType, level])

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
      if (!res.ok || data.error) {
        setError(data.error || 'Failed to get feedback. Please try again.')
      } else {
        setFeedback(data)
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
      {/* Prompt */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">
              {t('prompt')}
            </div>
            <p className="text-gray-800 text-sm leading-relaxed">{prompt}</p>
          </div>
          <button
            onClick={generatePrompt}
            className="flex-shrink-0 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('newTask')}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('placeholder')}
          rows={10}
          className="w-full text-sm text-gray-800 focus:outline-none resize-none leading-relaxed"
        />
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            {wordCount} {t('wordCount')}
          </span>
          <button
            onClick={handleSubmit}
            disabled={loading || wordCount < 5}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('submitting') : t('submit')}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
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
              <div className="text-xs text-gray-400 mb-0.5">{t('feedback.band')}</div>
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

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-semibold text-gray-700 mb-1">{t('feedback.overall')}</div>
            <p className="text-sm text-gray-600 leading-relaxed">{feedback.overallFeedback}</p>
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
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100',
    purple: 'bg-purple-50 border-purple-100',
    green: 'bg-green-50 border-green-100',
    orange: 'bg-orange-50 border-orange-100',
  }

  return (
    <div className={`p-3 rounded-lg border ${colors[color]}`}>
      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">{title}</div>
      <p className="text-sm text-gray-700 leading-relaxed">{content}</p>
    </div>
  )
}
