'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

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

export default function ListeningPlayer() {
  const t = useTranslations('listening')
  const [content, setContent] = useState<Content | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const utteranceRef = { current: null as SpeechSynthesisUtterance | null }

  const generate = async () => {
    setLoading(true)
    setContent(null)
    setSelectedAnswers({})
    setSubmitted(false)
    setScore(null)
    setError('')
    try {
      const res = await fetch('/api/listening/generate')
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || 'Failed to generate content. Please try again.')
      } else {
        setContent(data)
      }
    } catch {
      setError('Connection error. Please try again.')
    }
    setLoading(false)
  }

  const playPassage = () => {
    if (!content) return
    if (isPlaying) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
      return
    }

    const utterance = new SpeechSynthesisUtterance(content.passage)
    utterance.lang = 'en-US'
    utterance.rate = 0.85
    utterance.pitch = 1
    utterance.onend = () => setIsPlaying(false)
    utterance.onerror = () => setIsPlaying(false)
    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
    setIsPlaying(true)
  }

  const handleSubmit = async () => {
    if (!content) return
    let correct = 0
    content.questions.forEach((q, i) => {
      if (selectedAnswers[i] === q.correct) correct++
    })
    const pct = Math.round((correct / content.questions.length) * 100)
    setScore(pct)
    setSubmitted(true)

    await fetch('/api/listening/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passage: content.passage, score: pct }),
    })
  }

  const answeredAll = content ? Object.keys(selectedAnswers).length === content.questions.length : false

  return (
    <div className="space-y-4">
      {/* Generate button */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
        <div className="text-4xl mb-4">🎧</div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('title')}</h2>
        <p className="text-gray-500 text-sm mb-6">
          Generate an AI-created passage, listen to it, and answer comprehension questions.
        </p>
        <button
          onClick={generate}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? t('generating') : t('generate')}
        </button>
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <span>⚠️</span> {error}
            <button onClick={() => setError('')} className="ml-auto font-bold text-red-400 hover:text-red-600">×</button>
          </div>
        )}
      </div>

      {content && (
        <>
          {/* Passage */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                {t('passage')}
              </h3>
              <button
                onClick={playPassage}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isPlaying
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isPlaying ? (
                  <>
                    <span>⏹</span> {t('stop')}
                  </>
                ) : (
                  <>
                    <span>▶</span> {t('play')}
                  </>
                )}
              </button>
            </div>
            <p className="text-gray-700 leading-relaxed text-sm">{content.passage}</p>
          </div>

          {/* Questions */}
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
                <button
                  onClick={generate}
                  className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  {t('generate')}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
