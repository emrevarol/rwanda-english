'use client'

import { useRef, useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

interface Props {
  userName: string
  userLevel: string
  onClose: () => void
}

export default function ShareCard({ userName, userLevel, onClose }: Props) {
  const t = useTranslations('social')
  const cardRef = useRef<HTMLDivElement>(null)
  const [stats, setStats] = useState({ writing: 0, speaking: 0, listening: 0, vocabulary: 0, grammar: 0 })
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((d) => {
        setStats({
          writing: Math.round((d.avgWriting / 9) * 100) / 10,
          speaking: Math.round(d.avgSpeaking * 10) / 10,
          listening: Math.round(d.avgListening) / 10,
          vocabulary: d.vocabAccuracy != null ? Math.round(d.vocabAccuracy) / 10 : 0,
          grammar: d.avgGrammar != null ? Math.round((d.avgGrammar / 9) * 100) / 10 : 0,
        })
        if (d.referralCode) setReferralCode(d.referralCode)
      })
      .catch(() => {})
  }, [])

  const shareTextPlain = t('shareText', {
    name: userName,
    level: userLevel,
    writing: stats.writing,
    speaking: stats.speaking,
    listening: stats.listening,
    vocabulary: stats.vocabulary,
    grammar: stats.grammar,
  })

  // Rich formatted text for social media
  const shareTextFormatted = `🎓 ${userName} — ${userLevel} level on english.cash!\n\n📊 My scores:\n✍️ Writing: ${stats.writing}/10\n🗣️ Speaking: ${stats.speaking}/10\n👂 Listening: ${stats.listening}/10\n📚 Vocabulary: ${stats.vocabulary}/10\n📝 Grammar: ${stats.grammar}/10\n\n🚀 Learn English with AI — try it free!`

  const siteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${referralCode ? `?ref=${referralCode}` : ''}`
    : 'https://english.cash'

  const shareToWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareTextFormatted + '\n\n' + siteUrl)}`
    window.open(url, '_blank')
  }

  const shareToLinkedIn = () => {
    const fullText = shareTextFormatted + '\n\n' + siteUrl
    const url = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(fullText)}`
    window.open(url, '_blank', 'width=600,height=600')
  }

  const shareToTwitter = () => {
    // Twitter/X has 280 char limit, use compact format
    const tweetText = `🎓 I'm at ${userLevel} level on english.cash!\n\n✍️ ${stats.writing}/10 · 🗣️ ${stats.speaking}/10 · 👂 ${stats.listening}/10 · 📚 ${stats.vocabulary}/10 · 📝 ${stats.grammar}/10\n\n🚀 Learn English with AI — try it free!`
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText + '\n\n' + siteUrl)}`
    window.open(url, '_blank', 'width=600,height=500')
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(shareTextFormatted + '\n\n' + siteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadCard = async () => {
    if (!cardRef.current) return
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 600
      canvas.height = 400
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Draw card background
      const grad = ctx.createLinearGradient(0, 0, 600, 400)
      grad.addColorStop(0, '#3b82f6')
      grad.addColorStop(1, '#8b5cf6')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.roundRect(0, 0, 600, 400, 20)
      ctx.fill()

      // White inner card
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.beginPath()
      ctx.roundRect(20, 20, 560, 360, 16)
      ctx.fill()

      // Text
      ctx.fillStyle = 'white'
      ctx.font = 'bold 28px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('english.cash', 300, 70)

      ctx.font = '16px Inter, sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.8)'
      ctx.fillText(t('shareCardSubtitle'), 300, 100)

      // Name & Level
      ctx.font = 'bold 36px Inter, sans-serif'
      ctx.fillStyle = 'white'
      ctx.fillText(userName, 300, 170)

      ctx.font = 'bold 48px Inter, sans-serif'
      ctx.fillStyle = '#fbbf24'
      ctx.fillText(userLevel, 300, 230)

      // Stats
      ctx.font = '15px Inter, sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      const statsLine1 = `Writing: ${stats.writing}/10 · Speaking: ${stats.speaking}/10 · Listening: ${stats.listening}/10`
      const statsLine2 = `Vocabulary: ${stats.vocabulary}/10 · Grammar: ${stats.grammar}/10`
      ctx.fillText(statsLine1, 300, 280)
      ctx.fillText(statsLine2, 300, 305)

      // Footer
      ctx.font = '14px Inter, sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.fillText('english.cash', 300, 360)

      const link = document.createElement('a')
      link.download = 'english-cash-progress.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch {}
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800">{t('shareYourProgress')}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
      </div>

      {/* Preview card */}
      <div
        ref={cardRef}
        className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl p-6 text-white text-center mb-4"
      >
        <div className="text-sm opacity-80 mb-1">english.cash</div>
        <div className="text-2xl font-bold mb-1">{userName}</div>
        <div className="text-4xl font-extrabold text-yellow-300 mb-3">{userLevel}</div>
        <div className="flex justify-center gap-4 text-sm flex-wrap">
          {[
            { label: t('writing'), value: stats.writing, color: '#93c5fd' },
            { label: t('speaking'), value: stats.speaking, color: '#86efac' },
            { label: t('listening'), value: stats.listening, color: '#c4b5fd' },
            { label: t('vocabulary'), value: stats.vocabulary, color: '#fcd34d' },
            { label: t('grammar'), value: stats.grammar, color: '#fda4af' },
          ].map((s) => (
            <div key={s.label}>
              <div className="opacity-70">{s.label}</div>
              <div className="font-bold text-lg" style={{ color: s.color }}>{s.value}/10</div>
            </div>
          ))}
        </div>
      </div>

      {/* Share buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <button
          onClick={shareToWhatsApp}
          className="flex items-center justify-center gap-2 bg-[#25D366] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp
        </button>
        <button
          onClick={shareToLinkedIn}
          className="flex items-center justify-center gap-2 bg-[#0077b5] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          LinkedIn
        </button>
        <button
          onClick={shareToTwitter}
          className="flex items-center justify-center gap-2 bg-black text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          X / Twitter
        </button>
        <button
          onClick={downloadCard}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-orange-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          <span>📷</span>
          {t('downloadImage')}
        </button>
        <button
          onClick={copyToClipboard}
          className={`flex items-center justify-center gap-2 text-sm font-medium px-4 py-2.5 rounded-lg transition-all ${
            copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {copied ? '✓' : '📋'} {copied ? t('copied') : t('copyText')}
        </button>
      </div>
    </div>
  )
}
