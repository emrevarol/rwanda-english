'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations, useLocale } from 'next-intl'
import Navigation from '@/components/shared/Navigation'
import Avatar from '@/components/shared/Avatar'
import RadarCompare from '@/components/social/RadarCompare'
import ShareCard from '@/components/social/ShareCard'

interface UserResult {
  id: string
  name: string
  email: string
  level: string
  avatar?: string | null
  bio?: string | null
}

interface FriendItem extends UserResult {
  friendshipId: string
}

interface CompareData {
  me: { id: string; name: string; level: string; stats: Record<string, number>; raw: Record<string, number> }
  friend: { id: string; name: string; level: string; stats: Record<string, number>; raw: Record<string, number> }
}

interface ReferralData {
  referralCode: string
  totalReferred: number
  premiumReferred: number
  bonusDaysEarned: number
  referrals: Array<{ name: string; isPremium: boolean; date: string }>
}

export default function FriendsPage() {
  const t = useTranslations('social')
  const locale = useLocale()
  const { data: session, status } = useSession()
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<UserResult[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [friends, setFriends] = useState<FriendItem[]>([])
  const [pendingSent, setPendingSent] = useState<FriendItem[]>([])
  const [pendingReceived, setPendingReceived] = useState<FriendItem[]>([])
  const [compareData, setCompareData] = useState<CompareData | null>(null)
  const [comparingId, setComparingId] = useState<string | null>(null)
  const [showShare, setShowShare] = useState(false)
  const [referral, setReferral] = useState<ReferralData | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchFriends()
      fetchReferral()
    }
  }, [status])

  // Load all users on mount + search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchFriends = async () => {
    const res = await fetch('/api/friends')
    if (res.ok) {
      const data = await res.json()
      setFriends(data.friends)
      setPendingSent(data.pendingSent)
      setPendingReceived(data.pendingReceived)
    }
  }

  const fetchReferral = async () => {
    const res = await fetch('/api/referral')
    if (res.ok) setReferral(await res.json())
  }

  const searchUsers = async (p: number) => {
    const params = new URLSearchParams({ page: String(p) })
    if (search.length >= 2) params.set('q', search)
    const res = await fetch(`/api/users/search?${params}`)
    if (res.ok) {
      const data = await res.json()
      setResults(data.users)
      setTotalUsers(data.total)
      setPage(data.page)
      setTotalPages(data.totalPages)
    }
  }

  const addFriend = async (friendId: string) => {
    await fetch('/api/friends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ friendId }),
    })
    fetchFriends()
  }

  const respondRequest = async (friendshipId: string, action: 'accept' | 'reject') => {
    await fetch(`/api/friends/${friendshipId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    fetchFriends()
  }

  const removeFriend = async (friendshipId: string) => {
    await fetch(`/api/friends/${friendshipId}`, { method: 'DELETE' })
    fetchFriends()
    if (compareData) setCompareData(null)
  }

  const compareFriend = async (friendId: string) => {
    setComparingId(friendId)
    const res = await fetch(`/api/users/compare?friendId=${friendId}`)
    if (res.ok) {
      setCompareData(await res.json())
    }
    setComparingId(null)
  }

  const copyReferralLink = () => {
    if (!referral) return
    const link = `${window.location.origin}/${locale}/register?ref=${referral.referralCode}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">{t('loginMessage')}</p>
      </div>
    )
  }

  const levelColors: Record<string, string> = {
    A1: 'bg-red-100 text-red-700',
    A2: 'bg-orange-100 text-orange-700',
    B1: 'bg-yellow-100 text-yellow-700',
    B2: 'bg-green-100 text-green-700',
    C1: 'bg-blue-100 text-blue-700',
    C2: 'bg-purple-100 text-purple-700',
  }

  const isAlreadyFriend = (id: string) =>
    friends.some((f) => f.id === id) ||
    pendingSent.some((f) => f.id === id) ||
    pendingReceived.some((f) => f.id === id)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-gray-500 text-sm mt-0.5">{t('subtitle')}</p>
          </div>
          <button
            onClick={() => setShowShare(!showShare)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm"
          >
            {t('shareProgress')}
          </button>
        </div>

        {/* Share Card */}
        {showShare && session?.user && (
          <ShareCard
            userName={session.user.name || ''}
            userLevel={session.user.level || 'B1'}
            onClose={() => setShowShare(false)}
          />
        )}

        {/* Invite & Referral */}
        {referral && (
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-5 text-white">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h3 className="font-bold text-lg">{t('inviteTitle')}</h3>
                <p className="text-emerald-100 text-sm mt-1">{t('inviteSubtitle')}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur rounded-lg px-4 py-2 text-center">
                  <div className="text-2xl font-bold">{referral.totalReferred}</div>
                  <div className="text-xs text-emerald-200">{t('invited')}</div>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-lg px-4 py-2 text-center">
                  <div className="text-2xl font-bold">{referral.bonusDaysEarned}</div>
                  <div className="text-xs text-emerald-200">{t('daysEarned')}</div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="flex-1 bg-white/10 backdrop-blur rounded-lg px-4 py-2.5 font-mono text-sm tracking-wider">
                {referral.referralCode}
              </div>
              <button
                onClick={copyReferralLink}
                className="bg-white text-emerald-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-50 transition-colors whitespace-nowrap"
              >
                {copied ? t('copied') : t('copyLink')}
              </button>
            </div>
            {referral.referrals.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {referral.referrals.map((r, i) => (
                  <span key={i} className={`text-xs px-2 py-1 rounded-full ${r.isPremium ? 'bg-yellow-400 text-yellow-900' : 'bg-white/20'}`}>
                    {r.name} {r.isPremium ? '(+7 days)' : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pending Requests — shown prominently at top */}
        {pendingReceived.length > 0 && (
          <div className="bg-amber-50 rounded-xl border-2 border-amber-300 p-5 shadow-sm">
            <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold">{pendingReceived.length}</span>
              {t('pendingRequests')}
            </h3>
            <div className="space-y-2">
              {pendingReceived.map((f) => (
                <div key={f.friendshipId} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar src={f.avatar} name={f.name} size={40} />
                    <div>
                      <div className="text-sm font-medium text-gray-800">{f.name}</div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${levelColors[f.level]}`}>{f.level}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => respondRequest(f.friendshipId, 'accept')} className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium transition-colors">
                      {t('accept')}
                    </button>
                    <button onClick={() => respondRequest(f.friendshipId, 'reject')} className="text-sm bg-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                      {t('reject')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-3">{t('yourFriends')} ({friends.length})</h3>
          {friends.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">{t('noFriends')}</p>
          ) : (
            <div className="space-y-2">
              {friends.map((f) => (
                <div key={f.friendshipId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar src={f.avatar} name={f.name} size={40} />
                    <div>
                      <div className="text-sm font-medium text-gray-800">{f.name}</div>
                      <div className="text-xs text-gray-400">{f.email}</div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${levelColors[f.level] || 'bg-gray-100'}`}>
                      {f.level}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => compareFriend(f.id)}
                      disabled={comparingId === f.id}
                      className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 border border-blue-200 transition-colors disabled:opacity-50"
                    >
                      {comparingId === f.id ? '...' : t('compare')}
                    </button>
                    <button
                      onClick={() => removeFriend(f.friendshipId)}
                      className="text-xs text-gray-400 hover:text-red-500 px-2 py-1.5 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Search & Browse Users */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">{t('findFriends')}</h3>
            <span className="text-xs text-gray-400">{totalUsers} {t('totalLearners')}</span>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="mt-3 space-y-2">
            {results.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar src={u.avatar} name={u.name} size={36} />
                  <div>
                    <div className="text-sm font-medium text-gray-800">{u.name}</div>
                    <div className="text-xs text-gray-400">{u.email}</div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${levelColors[u.level] || 'bg-gray-100 text-gray-600'}`}>
                    {u.level}
                  </span>
                </div>
                {isAlreadyFriend(u.id) ? (
                  <span className="text-xs text-gray-400">{t('alreadyAdded')}</span>
                ) : (
                  <button
                    onClick={() => addFriend(u.id)}
                    className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t('addFriend')}
                  </button>
                )}
              </div>
            ))}
            {results.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">{t('noResults')}</p>
            )}
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => searchUsers(page - 1)}
                disabled={page <= 1}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50"
              >
                {t('prev')}
              </button>
              <span className="text-xs text-gray-500">{page} / {totalPages}</span>
              <button
                onClick={() => searchUsers(page + 1)}
                disabled={page >= totalPages}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50"
              >
                {t('next')}
              </button>
            </div>
          )}
        </div>

        {/* Pending Sent */}
        {pendingSent.length > 0 && (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-500 mb-2">{t('sentRequests')}</h3>
            <div className="flex flex-wrap gap-2">
              {pendingSent.map((f) => (
                <span key={f.friendshipId} className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-full text-gray-500">
                  {f.name} — {t('pending')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Compare Radar */}
        {compareData && (
          <RadarCompare data={compareData} onClose={() => setCompareData(null)} />
        )}
      </div>
    </div>
  )
}
