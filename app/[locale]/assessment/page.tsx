'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import Navigation from '@/components/shared/Navigation'
import { getAssessmentQuestions } from '@/lib/helpers'

const questions = getAssessmentQuestions()

export default function AssessmentPage() {
  const t = useTranslations('assessment')
  const { data: session } = useSession()
  const locale = useLocale()
  const router = useRouter()

  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [result, setResult] = useState<{ level: string; score: number; feedback: string } | null>(null)
  const [loading, setLoading] = useState(false)

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{t('loginMessage')}</p>
          <Link href="/login" className="text-blue-600 hover:underline">{t('back')}</Link>
        </div>
      </div>
    )
  }

  const question = questions[current]

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent(current + 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const answersArray = questions.map((q) => ({
        question: q.question,
        userAnswer: answers[q.id] || '',
      }))

      const res = await fetch('/api/assessment/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answersArray }),
      })

      const data = await res.json()
      setResult(data)
    } catch {
      alert('Failed to grade assessment')
    }
    setLoading(false)
  }

  if (result) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('result.title')}</h2>
            <div className="my-6">
              <div className="text-sm text-gray-500 mb-1">{t('result.level')}</div>
              <div className="text-5xl font-bold text-blue-600">{result.level}</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <div className="text-sm text-gray-500 mb-1">{t('result.score')}</div>
              <div className="text-3xl font-bold text-blue-700">{result.score}%</div>
            </div>
            <p className="text-gray-600 mb-8 text-sm leading-relaxed">{result.feedback}</p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/dashboard"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {t('result.dashboard')}
              </Link>
              <button
                onClick={() => {
                  setResult(null)
                  setCurrent(0)
                  setAnswers({})
                }}
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('result.retry')}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-500 mt-2 text-sm">{t('subtitle')}</p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>{t('question')} {current + 1} {t('of')} {questions.length}</span>
            <span>{Math.round(((current) / questions.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-blue-600 rounded-full transition-all"
              style={{ width: `${((current) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">{question.question}</h2>

          {question.type === 'multiple-choice' ? (
            <div className="space-y-3">
              {question.options?.map((option, i) => (
                <button
                  key={i}
                  onClick={() => setAnswers({ ...answers, [question.id]: option })}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all text-sm ${
                    answers[question.id] === option
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <div>
              {question.hint && (
                <p className="text-sm text-gray-600 mb-3 italic">{question.hint}</p>
              )}
              <textarea
                value={answers[question.id] || ''}
                onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                placeholder={t('yourAnswer')}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrent(Math.max(0, current - 1))}
              disabled={current === 0}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30"
            >
              {t('back')}
            </button>

            {current < questions.length - 1 ? (
              <button
                onClick={handleNext}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                {t('next')} →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? '...' : t('submit')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
