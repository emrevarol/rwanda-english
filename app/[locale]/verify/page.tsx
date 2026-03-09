'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'

export default function VerifyPage() {
  const t = useTranslations('auth.verify')
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const devOtp = searchParams.get('otp') || ''

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [resent, setResent] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setSuccess(true)
        setTimeout(() => router.push(`/${locale}/login?verified=true`), 2000)
      } else {
        setError(t('error'))
      }
    } catch {
      setError(t('error'))
    }
    setLoading(false)
  }

  const handleResend = async () => {
    setResent(false)
    const res = await fetch('/api/auth/resend-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (res.ok) setResent(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-3xl">📧</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-500 mt-2">
            {t('subtitle')} <span className="font-medium text-gray-700">{email}</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {success ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">✅</div>
              <p className="text-green-600 font-medium">{t('success')}</p>
            </div>
          ) : (
            <>
              {/* Dev mode OTP display */}
              {devOtp && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6 text-center">
                  <div className="text-xs text-amber-600 mb-1">{t('devNote')}</div>
                  <div className="text-2xl font-mono font-bold text-amber-800 tracking-[0.3em]">{devOtp}</div>
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                    {error}
                  </div>
                )}
                <div>
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder={t('placeholder')}
                    className="w-full border border-gray-300 rounded-lg px-4 py-4 text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? t('verifying') : t('submit')}
                </button>
              </form>

              <div className="text-center mt-6">
                <button
                  onClick={handleResend}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {t('resend')}
                </button>
                {resent && (
                  <p className="text-green-600 text-sm mt-2">{t('resent')}</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
