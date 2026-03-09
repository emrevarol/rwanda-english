'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import Navigation from '@/components/shared/Navigation'
import TodayCard from '@/components/learning-path/TodayCard'
import StreakBanner from '@/components/learning-path/StreakBanner'
import ConsistencyChart from '@/components/learning-path/ConsistencyChart'
import FullPathView from '@/components/learning-path/FullPathView'
import type { DayPlan } from '@/lib/learningPath'

interface TodayData {
  dayNumber: number
  plan: DayPlan
  progress: { task1Done: boolean; task2Done: boolean }
  streak: number
  totalDays: number
}

interface HistoryData {
  heatmapDays: Array<{ date: string; count: number }>
  upcomingDays: any[]
  currentDay: number
}

export default function LearningPathPage() {
  const { data: session, status } = useSession()
  const locale = useLocale()
  const t = useTranslations('learningPath')
  const tc = useTranslations('common')
  const [todayData, setTodayData] = useState<TodayData | null>(null)
  const [historyData, setHistoryData] = useState<HistoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'today' | 'path' | 'consistency'>('today')

  const fetchAll = async () => {
    const [today, history] = await Promise.all([
      fetch('/api/learning-path/today').then(r => r.json()),
      fetch('/api/learning-path/history').then(r => r.json()),
    ])
    setTodayData(today)
    setHistoryData(history)
    setLoading(false)
  }

  useEffect(() => {
    if (status === 'authenticated') fetchAll()
  }, [status])

  const markDone = async (task: 'task1' | 'task2') => {
    await fetch('/api/learning-path/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task }),
    })
    fetchAll()
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">{t('loginMessage')}</p>
      </div>
    )
  }

  const progressPct = todayData ? Math.round((todayData.dayNumber / 365) * 100) : 0
  const bothDone = todayData?.progress.task1Done && todayData?.progress.task2Done

  // Localized month names
  const monthNames = Array.from({ length: 12 }, (_, i) =>
    new Date(2024, i, 1).toLocaleDateString(locale, { month: 'short' })
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-gray-500 text-sm mt-0.5">{t('subtitle')}</p>
          </div>
          {todayData && (
            <div className="text-right">
              <div className="text-3xl font-extrabold text-blue-600">{t('day')} {todayData.dayNumber}</div>
              <div className="text-xs text-gray-400">{t('of365')}</div>
            </div>
          )}
        </div>

        {/* Journey progress bar */}
        {todayData && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">{t('overallProgress')}</span>
              <span className="text-blue-600 font-bold">{progressPct}% {t('complete')}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-3 bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.max(progressPct, 0.5)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1.5">
              <span>{t('day1')}</span>
              <span className="text-green-600 font-medium">{t('daysCompleted', { count: todayData.dayNumber })}</span>
              <span>{t('day365')}</span>
            </div>
          </div>
        )}

        {/* Streak */}
        {todayData && (
          <StreakBanner streak={todayData.streak} bothDone={!!bothDone} />
        )}

        {/* Tabs */}
        <div className="flex gap-2 bg-white rounded-xl border border-gray-200 p-1">
          {(['today', 'path', 'consistency'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {tab === 'today' ? t('tabToday') : tab === 'path' ? t('tabPath') : t('tabConsistency')}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
            {tc('loading')}
          </div>
        ) : (
          <>
            {activeTab === 'today' && todayData && (
              <div className="space-y-4">
                <TodayCard
                  plan={todayData.plan}
                  progress={todayData.progress}
                  onComplete={markDone}
                  locale={locale}
                />
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <div className="text-sm font-semibold text-amber-800 mb-0.5">{t('todaysTip')}</div>
                    <p className="text-sm text-amber-700">{todayData.plan.tipKey ? t(todayData.plan.tipKey) : todayData.plan.tip}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'path' && historyData && (
              <FullPathView days={historyData.upcomingDays} currentDay={historyData.currentDay} />
            )}

            {activeTab === 'consistency' && historyData && (
              <div className="space-y-4">
                <ConsistencyChart days={historyData.heatmapDays} />
                {/* Monthly breakdown */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-800 mb-4">{t('monthlySummary')}</h3>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {Array.from({ length: 12 }, (_, i) => {
                      const monthDays = historyData.heatmapDays.filter(d => new Date(d.date).getMonth() === i)
                      const active = monthDays.filter(d => d.count > 0).length
                      const total = monthDays.length
                      const pct = total > 0 ? Math.round((active / total) * 100) : 0
                      return (
                        <div key={i} className="text-center p-2 bg-gray-50 rounded-lg">
                          <div className="text-xs font-medium text-gray-500 mb-1">{monthNames[i]}</div>
                          <div className="text-sm font-bold text-gray-800">{active}<span className="text-gray-400 font-normal">/{total}</span></div>
                          <div className="h-1 bg-gray-200 rounded-full mt-1">
                            <div className="h-1 bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
