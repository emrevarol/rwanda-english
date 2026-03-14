'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import Navigation from '@/components/shared/Navigation'
import SkillsRadar from '@/components/dashboard/SkillsRadar'
import ScoreChart from '@/components/dashboard/ScoreChart'

interface ActivityItem {
  id: string
  type: string
  date: string
  score: number
  detail: string
  // Writing fields
  prompt?: string
  response?: string
  feedback?: string
  vocabularyScore?: number | null
  grammarScore?: number | null
  // Speaking fields
  transcript?: string
  // Listening fields
  passage?: string
}

interface DashboardData {
  level: string
  levelUp?: { from: string; to: string } | null
  avgWriting: number
  avgSpeaking: number
  avgListening: number
  avgVocabulary: number | null
  avgGrammar: number | null
  vocabMasteryPct: number | null
  vocabAccuracy: number | null
  vocabTotal: number
  vocabMastered: number
  writingHistory: Array<{ date: string; score: number }>
  speakingHistory: Array<{ date: string; score: number }>
  listeningHistory: Array<{ date: string; score: number }>
  vocabHistory: Array<{ date: string; score: number }>
  grammarHistory: Array<{ date: string; score: number }>
  recentActivity: ActivityItem[]
}

interface TodayPlan {
  dayNumber: number
  plan: { theme: string; themeKey?: string; task1: { title: string; icon: string; href: string }; task2: { title: string; icon: string; href: string } }
  progress: { task1Done: boolean; task2Done: boolean }
  streak: number
}

export default function DashboardPage() {
  const t = useTranslations('dashboard')
  const tl = useTranslations('learningPath')
  const { data: session, status } = useSession()
  const locale = useLocale()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [todayPlan, setTodayPlan] = useState<TodayPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null)

  // Redirect to assessment if not done yet
  useEffect(() => {
    if (status === 'authenticated' && session?.user && !session.user.assessmentDone) {
      router.push(`/${locale}/assessment`)
    }
  }, [status, session, locale, router])

  useEffect(() => {
    if (status === 'authenticated') {
      Promise.all([
        fetch('/api/dashboard').then((r) => { if (!r.ok) throw new Error(`Dashboard API ${r.status}`); return r.json() }),
        fetch('/api/learning-path/today').then((r) => r.json()).catch(() => null),
      ]).then(([dash, plan]) => {
        setData(dash)
        if (plan) setTodayPlan(plan)
      }).catch((err) => {
        console.error('Dashboard fetch error:', err)
      }).finally(() => setLoading(false))
    }
  }, [status])

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">{t('loginMessage')}</p>
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

  // Vocabulary: prefer accuracy (correct/total answers), then mastery, then writing sub-score
  const vocabPct = data
    ? data.vocabAccuracy != null
      ? data.vocabAccuracy
      : data.vocabMasteryPct != null
        ? data.vocabMasteryPct
        : data.avgVocabulary != null
          ? (data.avgVocabulary / 9) * 100
          : (data.avgWriting / 9) * 100
    : 0
  const grammarPct = data
    ? data.avgGrammar != null
      ? (data.avgGrammar / 9) * 100
      : (data.avgWriting / 9) * 100
    : 0

  const skillsData = [
    { subject: t('writing'), value: data ? (data.avgWriting / 9) * 100 : 0, color: '#2563eb' },
    { subject: t('speaking'), value: data ? data.avgSpeaking * 10 : 0, color: '#16a34a' },
    { subject: t('listening'), value: data ? data.avgListening : 0, color: '#9333ea' },
    { subject: t('vocabulary'), value: vocabPct, color: '#f59e0b' },
    { subject: t('grammar'), value: grammarPct, color: '#e11d48' },
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

        {/* Level Up Banner */}
        {data?.levelUp && (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-5 mb-6 text-white flex items-center gap-4 shadow-md animate-pulse">
            <div className="text-4xl">🎉</div>
            <div>
              <div className="font-bold text-lg">Level Up! {data.levelUp.from} → {data.levelUp.to}</div>
              <div className="text-sm text-yellow-100">Congratulations! Your skills have improved and you've been promoted to {data.levelUp.to} level.</div>
            </div>
          </div>
        )}

        {/* Today's Plan Banner */}
        {todayPlan && (
          <Link href="/learning-path">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 mb-6 text-white flex items-center justify-between hover:from-blue-700 hover:to-blue-800 transition-all cursor-pointer shadow-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  🗓
                </div>
                <div>
                  <div className="text-xs text-blue-200 font-medium uppercase tracking-wide">{t('dayOf', { day: todayPlan.dayNumber })}</div>
                  <div className="font-bold text-lg">{todayPlan.plan.themeKey ? tl(todayPlan.plan.themeKey) : todayPlan.plan.theme}</div>
                  <div className="text-sm text-blue-200 mt-0.5 flex items-center gap-3">
                    <span>{todayPlan.plan.task1.icon} {todayPlan.plan.task1.title}</span>
                    <span>·</span>
                    <span>{todayPlan.plan.task2.icon} {todayPlan.plan.task2.title}</span>
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                {todayPlan.progress.task1Done && todayPlan.progress.task2Done ? (
                  <div className="bg-green-400 text-green-900 text-sm font-bold px-3 py-1.5 rounded-full">{t('allDone')}</div>
                ) : todayPlan.progress.task1Done || todayPlan.progress.task2Done ? (
                  <div className="bg-yellow-400 text-yellow-900 text-sm font-bold px-3 py-1.5 rounded-full">{t('halfDone')}</div>
                ) : (
                  <div className="bg-white/20 text-white text-sm font-medium px-3 py-1.5 rounded-full">{t('startBtn')}</div>
                )}
                {todayPlan.streak > 0 && (
                  <div className="text-yellow-300 text-xs mt-1.5">{t('dayStreak', { streak: todayPlan.streak })}</div>
                )}
              </div>
            </div>
          </Link>
        )}

        {/* Level badge */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center col-span-2 md:col-span-1">
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
              {loading ? '—' : data ? Math.round((data.avgWriting / 9) * 100) / 10 : 0}
            </div>
            <div className="text-xs text-gray-400">/10</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <div className="text-sm text-gray-500 mb-2">{t('speaking')}</div>
            <div className="text-3xl font-bold text-green-600">
              {loading ? '—' : data?.avgSpeaking || 0}
            </div>
            <div className="text-xs text-gray-400">/10</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <div className="text-sm text-gray-500 mb-2">{t('listening')}</div>
            <div className="text-3xl font-bold text-purple-600">
              {loading ? '—' : data ? Math.round(data.avgListening) / 10 : 0}
            </div>
            <div className="text-xs text-gray-400">/10</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <div className="text-sm text-gray-500 mb-2">{t('vocabulary')}</div>
            <div className="text-3xl font-bold text-amber-600">
              {loading ? '—' : data?.vocabAccuracy != null ? Math.round(data.vocabAccuracy) / 10 : '—'}
            </div>
            <div className="text-xs text-gray-400">/10</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <div className="text-sm text-gray-500 mb-2">{t('grammar')}</div>
            <div className="text-3xl font-bold" style={{ color: '#e11d48' }}>
              {loading ? '—' : data?.avgGrammar != null ? Math.round((data.avgGrammar / 9) * 100) / 10 : '—'}
            </div>
            <div className="text-xs text-gray-400">/10</div>
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('progressOverTime')}</h2>
            <ScoreChart
              writingData={data?.writingHistory || []}
              speakingData={data?.speakingHistory || []}
              listeningData={data?.listeningHistory || []}
              vocabData={data?.vocabHistory || []}
              grammarData={data?.grammarHistory || []}
            />
          </div>
        </div>

        {/* Recent Activity + CTA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('recentActivity')}</h2>
            {loading ? (
              <p className="text-gray-600 text-sm">{t('noDataYet')}</p>
            ) : data?.recentActivity.length === 0 ? (
              <p className="text-gray-600 text-sm">{t('noActivity')}</p>
            ) : (
              <div className="space-y-3">
                {data?.recentActivity.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedActivity(item)}
                    className="w-full flex items-center justify-between py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {item.type === 'writing' ? '✍️' : item.type === 'speaking' ? '🎙️' : item.type === 'vocabulary' ? '📚' : item.type === 'grammar' ? '📝' : '🎧'}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-gray-700 capitalize">
                          {item.type} — {item.detail}
                        </div>
                        <div className="text-xs text-gray-600">
                          {new Date(item.date).toLocaleDateString(locale)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-blue-600">
                        {item.type === 'grammar'
                          ? item.detail
                          : item.type === 'writing' ? `${Math.round((item.score / 9) * 100) / 10}/10`
                          : item.type === 'vocabulary' ? `${Math.round(item.score) / 10}/10`
                          : item.type === 'listening' ? `${Math.round(item.score) / 10}/10`
                          : `${item.score}/10`}
                      </span>
                      <span className="text-gray-300 text-xs">›</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
            <h2 className="text-lg font-semibold mb-2">{t('continuelearning')}</h2>
            <p className="text-blue-100 text-sm mb-6">{t('keepPracticing')}</p>
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
                href="/vocabulary"
                className="block bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-3 rounded-lg transition-colors"
              >
                📚 {t('vocabulary')}
              </Link>
              <Link
                href="/grammar"
                className="block bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-3 rounded-lg transition-colors"
              >
                📝 {t('grammar')}
              </Link>
              <Link
                href="/tutor"
                className="block bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-3 rounded-lg transition-colors"
              >
                {t('aiTutor')}
              </Link>
              <Link
                href="/assessment"
                className="block bg-white text-blue-700 text-sm px-4 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors text-center"
              >
                {t('retakeTest')}
              </Link>
            </div>
          </div>
        </div>

        {/* Activity Detail Modal */}
        {selectedActivity && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedActivity(null)}>
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
              {/* Modal header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {selectedActivity.type === 'writing' ? '✍️' : selectedActivity.type === 'speaking' ? '🎙️' : '🎧'}
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-900 capitalize">{selectedActivity.type} — {selectedActivity.detail}</h3>
                    <p className="text-xs text-gray-500">{new Date(selectedActivity.date).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedActivity(null)} className="text-gray-400 hover:text-gray-600 text-2xl font-light">×</button>
              </div>

              <div className="px-6 py-5 space-y-5">
                {/* Score summary */}
                <div className="flex items-center gap-4">
                  <div className={`text-3xl font-bold ${selectedActivity.score >= 7 || selectedActivity.score >= 70 ? 'text-green-600' : selectedActivity.score >= 5 || selectedActivity.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {selectedActivity.type === 'writing'
                      ? `Band ${selectedActivity.score}/9`
                      : selectedActivity.type === 'speaking'
                      ? `${selectedActivity.score}/10`
                      : `${selectedActivity.score}%`}
                  </div>
                  {selectedActivity.type === 'writing' && (selectedActivity.vocabularyScore || selectedActivity.grammarScore) && (
                    <div className="flex gap-3 text-sm">
                      {selectedActivity.vocabularyScore != null && (
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">{t('vocabulary')}: {selectedActivity.vocabularyScore}/9</span>
                      )}
                      {selectedActivity.grammarScore != null && (
                        <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded">{t('grammar')}: {selectedActivity.grammarScore}/9</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Writing detail */}
                {selectedActivity.type === 'writing' && (
                  <>
                    {selectedActivity.prompt && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Prompt</h4>
                        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4">{selectedActivity.prompt}</p>
                      </div>
                    )}
                    {selectedActivity.response && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Your Response</h4>
                        <p className="text-sm text-gray-700 bg-blue-50 rounded-lg p-4 whitespace-pre-wrap">{selectedActivity.response}</p>
                      </div>
                    )}
                    {selectedActivity.feedback && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">AI Feedback</h4>
                        <div className="text-sm text-gray-700 bg-green-50 rounded-lg p-4 whitespace-pre-wrap">
                          {(() => {
                            try {
                              const fb = JSON.parse(selectedActivity.feedback!)
                              return typeof fb === 'string' ? fb : fb.feedback || fb.overall || JSON.stringify(fb, null, 2)
                            } catch { return selectedActivity.feedback }
                          })()}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Speaking detail */}
                {selectedActivity.type === 'speaking' && (
                  <>
                    {selectedActivity.transcript && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Your Transcript</h4>
                        <p className="text-sm text-gray-700 bg-blue-50 rounded-lg p-4 whitespace-pre-wrap">{selectedActivity.transcript}</p>
                      </div>
                    )}
                    {selectedActivity.feedback && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">AI Feedback</h4>
                        <div className="text-sm text-gray-700 bg-green-50 rounded-lg p-4 whitespace-pre-wrap">
                          {(() => {
                            try {
                              const fb = JSON.parse(selectedActivity.feedback!)
                              return typeof fb === 'string' ? fb : fb.feedback || fb.overall || JSON.stringify(fb, null, 2)
                            } catch { return selectedActivity.feedback }
                          })()}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Listening detail */}
                {selectedActivity.type === 'listening' && (
                  <>
                    {selectedActivity.passage && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Passage</h4>
                        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">{selectedActivity.passage}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
