'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import Navigation from '@/components/shared/Navigation'
import SkillsRadar from '@/components/dashboard/SkillsRadar'
import ScoreChart from '@/components/dashboard/ScoreChart'

interface DashboardData {
  level: string
  avgWriting: number
  avgSpeaking: number
  avgListening: number
  writingHistory: Array<{ date: string; score: number }>
  speakingHistory: Array<{ date: string; score: number }>
  recentActivity: Array<{ type: string; date: string; score: number; detail: string }>
}

interface TodayPlan {
  dayNumber: number
  plan: { theme: string; task1: { title: string; icon: string; href: string }; task2: { title: string; icon: string; href: string } }
  progress: { task1Done: boolean; task2Done: boolean }
  streak: number
}

export default function DashboardPage() {
  const t = useTranslations('dashboard')
  const { data: session, status } = useSession()
  const locale = useLocale()
  const [data, setData] = useState<DashboardData | null>(null)
  const [todayPlan, setTodayPlan] = useState<TodayPlan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'authenticated') {
      Promise.all([
        fetch('/api/dashboard').then((r) => r.json()),
        fetch('/api/learning-path/today').then((r) => r.json()),
      ]).then(([dash, plan]) => {
        setData(dash)
        setTodayPlan(plan)
      }).finally(() => setLoading(false))
    }
  }, [status])

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">
          Please{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            login
          </Link>{' '}
          to access your dashboard.
        </p>
      </div>
    )
  }

  const level = data?.level || session?.user?.level || 'B1'
  const levelColors: Record<string, string> = {
    A1: 'bg-red-100 text-red-700',
    A2: 'bg-orange-100 text-orange-700',
    B1: 'bg-yellow-100 text-yellow-700',
    B2: 'bg-green-100 text-green-700',
    C1: 'bg-blue-100 text-blue-700',
    C2: 'bg-purple-100 text-purple-700',
  }

  const skillsData = [
    { subject: t('writing'), value: data ? (data.avgWriting / 9) * 100 : 0 },
    { subject: t('speaking'), value: data ? data.avgSpeaking * 10 : 0 },
    { subject: t('listening'), value: data ? data.avgListening : 0 },
    { subject: t('vocabulary'), value: 60 },
    { subject: t('grammar'), value: 55 },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {t('welcome')}, {session?.user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500 mt-1">{t('title')}</p>
        </div>

        {/* Today's Plan Banner */}
        {todayPlan && (
          <Link href="/learning-path">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 mb-6 text-white flex items-center justify-between hover:from-blue-700 hover:to-blue-800 transition-all cursor-pointer shadow-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  🗓
                </div>
                <div>
                  <div className="text-xs text-blue-200 font-medium uppercase tracking-wide">Day {todayPlan.dayNumber} of 365</div>
                  <div className="font-bold text-lg">{todayPlan.plan.theme}</div>
                  <div className="text-sm text-blue-200 mt-0.5 flex items-center gap-3">
                    <span>{todayPlan.plan.task1.icon} {todayPlan.plan.task1.title}</span>
                    <span>·</span>
                    <span>{todayPlan.plan.task2.icon} {todayPlan.plan.task2.title}</span>
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                {todayPlan.progress.task1Done && todayPlan.progress.task2Done ? (
                  <div className="bg-green-400 text-green-900 text-sm font-bold px-3 py-1.5 rounded-full">✅ Done!</div>
                ) : todayPlan.progress.task1Done || todayPlan.progress.task2Done ? (
                  <div className="bg-yellow-400 text-yellow-900 text-sm font-bold px-3 py-1.5 rounded-full">½ Done</div>
                ) : (
                  <div className="bg-white/20 text-white text-sm font-medium px-3 py-1.5 rounded-full">Start →</div>
                )}
                {todayPlan.streak > 0 && (
                  <div className="text-yellow-300 text-xs mt-1.5">🔥 {todayPlan.streak}-day streak</div>
                )}
              </div>
            </div>
          </Link>
        )}

        {/* Level badge */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center col-span-1">
            <div className="text-sm text-gray-500 mb-2">{t('level')}</div>
            <div
              className={`text-4xl font-bold rounded-xl py-3 ${levelColors[level] || 'bg-gray-100 text-gray-700'}`}
            >
              {level}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <div className="text-sm text-gray-500 mb-2">{t('writing')}</div>
            <div className="text-3xl font-bold text-blue-600">
              {loading ? '—' : data?.avgWriting || 0}
            </div>
            <div className="text-xs text-gray-400">{t('bandScore')}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <div className="text-sm text-gray-500 mb-2">{t('speaking')}</div>
            <div className="text-3xl font-bold text-green-600">
              {loading ? '—' : data?.avgSpeaking || 0}
            </div>
            <div className="text-xs text-gray-400">{t('fluencyScore')}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <div className="text-sm text-gray-500 mb-2">{t('listening')}</div>
            <div className="text-3xl font-bold text-purple-600">
              {loading ? '—' : data?.avgListening || 0}%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Skills Radar */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('skills')}</h2>
            <SkillsRadar data={skillsData} />
          </div>

          {/* Score Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Progress Over Time</h2>
            <ScoreChart
              writingData={data?.writingHistory || []}
              speakingData={data?.speakingHistory || []}
            />
          </div>
        </div>

        {/* Recent Activity + CTA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('recentActivity')}</h2>
            {loading ? (
              <p className="text-gray-400 text-sm">Loading...</p>
            ) : data?.recentActivity.length === 0 ? (
              <p className="text-gray-400 text-sm">{t('noActivity')}</p>
            ) : (
              <div className="space-y-3">
                {data?.recentActivity.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {item.type === 'writing' ? '✍️' : item.type === 'speaking' ? '🎙️' : '🎧'}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-gray-700 capitalize">
                          {item.type} — {item.detail}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(item.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-blue-600">
                      {item.type === 'writing' ? `Band ${item.score}` : `${item.score}${item.type === 'listening' ? '%' : '/10'}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
            <h2 className="text-lg font-semibold mb-2">{t('continuelearning')}</h2>
            <p className="text-blue-100 text-sm mb-6">Keep practicing to improve your English proficiency level.</p>
            <div className="space-y-3">
              <Link
                href="/writing"
                className="block bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-3 rounded-lg transition-colors"
              >
                ✍️ {t('writing')}
              </Link>
              <Link
                href="/speaking"
                className="block bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-3 rounded-lg transition-colors"
              >
                🎙️ {t('speaking')}
              </Link>
              <Link
                href="/listening"
                className="block bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-3 rounded-lg transition-colors"
              >
                🎧 {t('listening')}
              </Link>
              <Link
                href="/tutor"
                className="block bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-3 rounded-lg transition-colors"
              >
                🤖 AI Tutor
              </Link>
              <Link
                href="/assessment"
                className="block bg-white text-blue-700 text-sm px-4 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors text-center"
              >
                📝 Retake Placement Test
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
