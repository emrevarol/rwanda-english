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
  const [stats, setStats] = useState({ avgWriting: 0, avgSpeaking: 0, avgListening: 0 })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((d) => setStats({ avgWriting: d.avgWriting, avgSpeaking: d.avgSpeaking, avgListening: d.avgListening }))
      .catch(() => {})
  }, [])

  const shareText = t('shareText', {
    name: userName,
    level: userLevel,
    writing: stats.avgWriting,
    speaking: stats.avgSpeaking,
    listening: stats.avgListening,
  })

  const shareToLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}&summary=${encodeURIComponent(shareText)}`
    window.open(url, '_blank', 'width=600,height=500')
  }

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.origin)}`
    window.open(url, '_blank', 'width=600,height=500')
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(shareText + '\n' + window.location.origin)
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
      ctx.font = '16px Inter, sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      const statsLine = `Writing: ${stats.avgWriting} · Speaking: ${stats.avgSpeaking} · Listening: ${stats.avgListening}`
      ctx.fillText(statsLine, 300, 290)

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
        <div className="flex justify-center gap-6 text-sm">
          <div>
            <div className="opacity-70">{t('writing')}</div>
            <div className="font-bold text-lg">{stats.avgWriting}</div>
          </div>
          <div>
            <div className="opacity-70">{t('speaking')}</div>
            <div className="font-bold text-lg">{stats.avgSpeaking}</div>
          </div>
          <div>
            <div className="opacity-70">{t('listening')}</div>
            <div className="font-bold text-lg">{stats.avgListening}</div>
          </div>
        </div>
      </div>

      {/* Share buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
