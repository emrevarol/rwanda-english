'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import Navigation from '@/components/shared/Navigation'

interface SubStatus {
  hasAccess: boolean
  trialEndsAt: string | null
  subscriptionStatus: string | null
  subscriptionPlan: string | null
  subscriptionEnd: string | null
  isStudent: boolean
}

export default function PricingPage() {
  const t = useTranslations('pricing')
  const { data: session } = useSession()
  const [status, setStatus] = useState<SubStatus | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    if (session) {
      fetch('/api/stripe/status')
        .then((r) => r.json())
        .then(setStatus)
        .catch(() => {})
    }
  }, [session])

  const handleSubscribe = async (plan: 'daily' | 'monthly') => {
    if (!session) {
      window.location.href = '/en/register'
      return
    }
    setLoading(plan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const text = await res.text()
      console.log('Checkout response:', res.status, text)
      try {
        const data = JSON.parse(text)
        if (data.url) {
          window.location.href = data.url
        } else {
          alert(JSON.stringify(data, null, 2))
        }
      } catch {
        alert('Response: ' + text.slice(0, 500))
      }
    } catch (err: any) {
      alert('Fetch error: ' + (err.message || String(err)))
    }
    setLoading(null)
  }

  const handleManage = async () => {
    setLoading('manage')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      alert('Something went wrong.')
    }
    setLoading(null)
  }

  const trialDaysLeft = status?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(status.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  const isSubscribed = status?.subscriptionStatus === 'active'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-500 mt-2">{t('subtitle')}</p>
        </div>

        {/* Trial/Status Banner */}
        {session && status && (
          <div className="mb-8">
            {isSubscribed ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-green-800 font-medium">
                  {t('activeSubscription', { plan: status.subscriptionPlan === 'daily' ? '$0.99/day' : '$19.99/month' })}
                </p>
                <p className="text-green-600 text-sm mt-1">
                  {t('nextBilling')}: {status.subscriptionEnd ? new Date(status.subscriptionEnd).toLocaleDateString() : '—'}
                </p>
                <button
                  onClick={handleManage}
                  disabled={loading === 'manage'}
                  className="mt-3 text-sm bg-white border border-green-300 text-green-700 px-4 py-2 rounded-lg hover:bg-green-50"
                >
                  {loading === 'manage' ? '...' : t('manageSubscription')}
                </button>
              </div>
            ) : trialDaysLeft > 0 ? (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <p className="text-blue-800 font-medium">
                  {t('trialActive', { days: trialDaysLeft })}
                </p>
                <p className="text-blue-600 text-sm mt-1">{t('trialDesc')}</p>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <p className="text-amber-800 font-medium">{t('trialExpired')}</p>
                <p className="text-amber-600 text-sm mt-1">{t('trialExpiredDesc')}</p>
              </div>
            )}
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free Trial */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col">
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{t('free')}</div>
            <div className="mt-2">
              <span className="text-4xl font-bold text-gray-900">$0</span>
              <span className="text-gray-500 ml-1">{t('freePeriod')}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">{t('freeDesc')}</p>
            <ul className="mt-4 space-y-2 flex-1">
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-green-500">✓</span> {t('freeFeature1')}
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-green-500">✓</span> {t('freeFeature2')}
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-green-500">✓</span> {t('freeFeature3')}
              </li>
            </ul>
            {!session ? (
              <Link
                href="/register"
                className="mt-6 block text-center bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                {t('freeBtn')}
              </Link>
            ) : (
              <div className="mt-6 text-center text-sm text-gray-400 py-3">
                {trialDaysLeft > 0 ? t('trialActive', { days: trialDaysLeft }) : t('trialUsed')}
              </div>
            )}
          </div>

          {/* Daily */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col">
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{t('daily')}</div>
            <div className="mt-2">
              <span className="text-4xl font-bold text-gray-900">{t('dailyPrice')}</span>
              <span className="text-gray-500 ml-1">{t('dailyPeriod')}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">{t('dailyDesc')}</p>
            {status?.isStudent && (
              <div className="mt-2 bg-purple-50 text-purple-700 text-xs font-medium px-2 py-1 rounded-lg inline-block">
                Student: $0.49/day
              </div>
            )}
            <ul className="mt-4 space-y-2 flex-1">
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-green-500">✓</span> {t('dailyFeature1')}
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-green-500">✓</span> {t('dailyFeature2')}
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-green-500">✓</span> {t('dailyFeature3')}
              </li>
            </ul>
            <button
              onClick={() => handleSubscribe('daily')}
              disabled={loading === 'daily' || isSubscribed}
              className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading === 'daily' ? '...' : isSubscribed ? t('currentPlan') : t('dailyBtn')}
            </button>
          </div>

          {/* Monthly — Most Popular */}
          <div className="bg-white rounded-2xl border-2 border-blue-500 p-6 flex flex-col relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              {t('popular')}
            </div>
            <div className="text-sm font-semibold text-blue-600 uppercase tracking-wide">{t('monthly')}</div>
            <div className="mt-2">
              <span className="text-4xl font-bold text-gray-900">{t('monthlyPrice')}</span>
              <span className="text-gray-500 ml-1">{t('monthlyPeriod')}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">{t('monthlyDesc')}</p>
            {status?.isStudent && (
              <div className="mt-2 bg-purple-50 text-purple-700 text-xs font-medium px-2 py-1 rounded-lg inline-block">
                Student: $9.99/month
              </div>
            )}
            <ul className="mt-4 space-y-2 flex-1">
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-green-500">✓</span> {t('monthlyFeature1')}
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-green-500">✓</span> {t('monthlyFeature2')}
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-green-500">✓</span> {t('monthlyFeature3')}
              </li>
            </ul>
            <button
              onClick={() => handleSubscribe('monthly')}
              disabled={loading === 'monthly' || isSubscribed}
              className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading === 'monthly' ? '...' : isSubscribed ? t('currentPlan') : t('monthlyBtn')}
            </button>
          </div>
        </div>

        {/* Student Discount */}
        <div className="mt-8 bg-purple-50 border border-purple-200 rounded-xl p-6 text-center">
          <p className="text-purple-800 font-medium">{t('studentDiscount')}</p>
          <p className="text-purple-600 text-sm mt-1">{t('studentDesc')}</p>
        </div>
      </div>
    </div>
  )
}
