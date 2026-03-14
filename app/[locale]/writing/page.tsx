'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import Navigation from '@/components/shared/Navigation'
import WritingEditor from '@/components/writing/WritingEditor'

export default function WritingPage() {
  const t = useTranslations('writing')
  const tc = useTranslations('common')
  const locale = useLocale()
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState<'practice' | 'history'>('practice')
  const [taskType, setTaskType] = useState<'task1' | 'task2'>('task2')
  const [history, setHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    if (activeTab === 'history' && status === 'authenticated') {
      setLoadingHistory(true)
      fetch('/api/writing/history')
        .then((r) => r.json())
        .then(setHistory)
        .finally(() => setLoadingHistory(false))
    }
  }, [activeTab, status])

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">{t('loginMessage')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {t('level')} <span className="font-medium text-sky-600">{session?.user?.level}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('practice')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'practice'
                  ? 'bg-sky-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('practice')}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-sky-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('history')}
            </button>
          </div>
        </div>

        {activeTab === 'practice' ? (
          <div>
            {/* Task type selector */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
              <div className="flex gap-3">
                <button
                  onClick={() => setTaskType('task1')}
                  className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${
                    taskType === 'task1'
                      ? 'bg-sky-50 border-2 border-sky-500 text-sky-700'
                      : 'border-2 border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  📊 {t('task1')}
                </button>
                <button
                  onClick={() => setTaskType('task2')}
                  className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${
                    taskType === 'task2'
                      ? 'bg-sky-50 border-2 border-sky-500 text-sky-700'
                      : 'border-2 border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  📝 {t('task2')}
                </button>
              </div>
            </div>

            <WritingEditor taskType={taskType} level={session?.user?.level || 'B1'} />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('history')}</h2>
            {loadingHistory ? (
              <p className="text-gray-600 text-sm">{tc('loading')}</p>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <div className="text-4xl mb-3">✍️</div>
                <p>{t('noSubmissions')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((sub: any) => {
                  const feedback = JSON.parse(sub.feedback || '{}')
                  return (
                    <div key={sub.id} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-xs font-medium bg-sky-100 text-sky-700 px-2 py-0.5 rounded mr-2">
                            {t('taskLabel', { n: sub.taskType === 'task1' ? 1 : 2 })}
                          </span>
                          <span className="text-xs text-gray-600">
                            {new Date(sub.createdAt).toLocaleDateString(locale)}
                          </span>
                        </div>
                        <span className="text-lg font-bold text-sky-600">Band {sub.band}</span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{sub.prompt}</p>
                      {feedback.overallFeedback && (
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2 italic">
                          {feedback.overallFeedback}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
