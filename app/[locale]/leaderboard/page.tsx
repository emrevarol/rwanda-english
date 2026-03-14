'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Navigation from '@/components/shared/Navigation'

interface LeaderboardEntry {
  id: string
  name: string
  level: string
  xp: number
  rank: number
  writingScore: number
  speakingScore: number
  listeningScore: number
  vocabScore: number
  totalActivities: number
  activeDays: number
  vocabWords: number
  isMe: boolean
}

const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-gray-100 text-gray-700',
  A2: 'bg-green-100 text-green-700',
  B1: 'bg-blue-100 text-blue-700',
  B2: 'bg-purple-100 text-purple-700',
  C1: 'bg-orange-100 text-orange-700',
  C2: 'bg-red-100 text-red-700',
}

export default function LeaderboardPage() {
  const t = useTranslations('leaderboard')
  const { status } = useSession()
  const [tab, setTab] = useState<'global' | 'friends'>('global')
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [myRank, setMyRank] = useState(0)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (status !== 'authenticated') return
    setLoading(true)
    fetch(`/api/leaderboard?tab=${tab}`)
      .then(r => r.json())
      .then(d => {
        setData(d.leaderboard || [])
        setMyRank(d.myRank || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [status, tab])

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Please login to view the leaderboard.</p>
      </div>
    )
  }

  const medalEmoji = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navigation />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('subtitle')}</p>
        </div>

        {/* Tab selector */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('global')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'global'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {t('global')}
          </button>
          <button
            onClick={() => setTab('friends')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'friends'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {t('friends')}
          </button>
        </div>

        {/* My rank banner */}
        {myRank > 0 && !loading && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-4 mb-6 flex items-center justify-between">
            <div>
              <div className="text-sm opacity-80">{t('yourRank')}</div>
              <div className="text-3xl font-bold">#{myRank}</div>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-80">{t('outOf')}</div>
              <div className="text-xl font-semibold">{data.length} {t('players')}</div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">{t('loading')}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && data.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="text-4xl mb-3">{tab === 'friends' ? '👥' : '🏆'}</div>
            <p className="text-gray-500 dark:text-gray-400">{tab === 'friends' ? t('noFriends') : t('noData')}</p>
          </div>
        )}

        {/* Leaderboard list */}
        {!loading && data.length > 0 && (
          <div className="space-y-2">
            {data.map(entry => {
              const medal = medalEmoji(entry.rank)
              const expanded = expandedId === entry.id
              return (
                <div key={entry.id}>
                  <button
                    onClick={() => setExpandedId(expanded ? null : entry.id)}
                    className={`w-full text-left bg-white dark:bg-gray-900 rounded-xl border transition-all ${
                      entry.isMe
                        ? 'border-blue-300 dark:border-blue-700 ring-1 ring-blue-200 dark:ring-blue-800'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    } ${entry.rank <= 3 ? 'shadow-sm' : ''}`}
                  >
                    <div className="flex items-center px-4 py-3 gap-3">
                      {/* Rank */}
                      <div className="w-10 text-center flex-shrink-0">
                        {medal ? (
                          <span className="text-2xl">{medal}</span>
                        ) : (
                          <span className="text-lg font-bold text-gray-400 dark:text-gray-500">{entry.rank}</span>
                        )}
                      </div>

                      {/* Avatar + Name */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            entry.isMe ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                            {entry.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-sm font-semibold truncate ${entry.isMe ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                                {entry.name}
                              </span>
                              {entry.isMe && <span className="text-xs text-blue-500">({t('you')})</span>}
                            </div>
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${LEVEL_COLORS[entry.level] || LEVEL_COLORS.B1}`}>
                              {entry.level}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* XP */}
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{entry.xp}</div>
                        <div className="text-xs text-gray-400">XP</div>
                      </div>
                    </div>
                  </button>

                  {/* Expanded details */}
                  {expanded && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-b-xl border border-t-0 border-gray-200 dark:border-gray-700 px-4 py-3 -mt-1">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="text-center">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('writing')}</div>
                          <div className="text-sm font-semibold" style={{ color: '#2563eb' }}>{entry.writingScore}%</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('speaking')}</div>
                          <div className="text-sm font-semibold" style={{ color: '#16a34a' }}>{entry.speakingScore}%</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('listening')}</div>
                          <div className="text-sm font-semibold" style={{ color: '#9333ea' }}>{entry.listeningScore}%</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('vocabulary')}</div>
                          <div className="text-sm font-semibold" style={{ color: '#f59e0b' }}>{entry.vocabScore}%</div>
                        </div>
                      </div>
                      <div className="flex justify-center gap-6 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                        <span>{entry.totalActivities} {t('activities')}</span>
                        <span>{entry.activeDays} {t('daysActive')}</span>
                        <span>{entry.vocabWords} {t('words')}</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
