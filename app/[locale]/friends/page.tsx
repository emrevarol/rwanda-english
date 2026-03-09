'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Navigation from '@/components/shared/Navigation'
import RadarCompare from '@/components/social/RadarCompare'
import ShareCard from '@/components/social/ShareCard'

interface UserResult {
  id: string
  name: string
  email: string
  level: string
}

interface FriendItem extends UserResult {
  friendshipId: string
}

interface CompareData {
  me: { id: string; name: string; level: string; stats: Record<string, number>; raw: Record<string, number> }
  friend: { id: string; name: string; level: string; stats: Record<string, number>; raw: Record<string, number> }
}

export default function FriendsPage() {
  const t = useTranslations('social')
  const { data: session, status } = useSession()
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<UserResult[]>([])
  const [friends, setFriends] = useState<FriendItem[]>([])
  const [pendingSent, setPendingSent] = useState<FriendItem[]>([])
  const [pendingReceived, setPendingReceived] = useState<FriendItem[]>([])
  const [compareData, setCompareData] = useState<CompareData | null>(null)
  const [comparingId, setComparingId] = useState<string | null>(null)
  const [showShare, setShowShare] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') fetchFriends()
  }, [status])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.length >= 2) searchUsers()
      else setResults([])
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

  const searchUsers = async () => {
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(search)}`)
    if (res.ok) setResults(await res.json())
  }

  const addFriend = async (friendId: string) => {
    await fetch('/api/friends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ friendId }),
    })
    fetchFriends()
    setSearch('')
    setResults([])
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

        {/* Search */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-3">{t('findFriends')}</h3>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {results.length > 0 && (
            <div className="mt-3 space-y-2">
              {results.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
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
            </div>
          )}
        </div>

        {/* Pending Requests */}
        {pendingReceived.length > 0 && (
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
            <h3 className="font-semibold text-amber-800 mb-3">{t('pendingRequests')} ({pendingReceived.length})</h3>
            <div className="space-y-2">
              {pendingReceived.map((f) => (
                <div key={f.friendshipId} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {f.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">{f.name}</div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${levelColors[f.level]}`}>{f.level}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => respondRequest(f.friendshipId, 'accept')} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">
                      {t('accept')}
                    </button>
                    <button onClick={() => respondRequest(f.friendshipId, 'reject')} className="text-xs bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-300">
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
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {f.name.charAt(0).toUpperCase()}
                    </div>
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
