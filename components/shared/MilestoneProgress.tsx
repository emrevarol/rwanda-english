'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

interface ProgressData {
  next: number | null
  current: number
  pct: number
}

const SKILL_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  writing: { icon: '✍️', color: '#0284c7', bg: '#f0f9ff' },
  speaking: { icon: '🎙️', color: '#16a34a', bg: '#f0fdf4' },
  listening: { icon: '🎧', color: '#9333ea', bg: '#faf5ff' },
  grammar: { icon: '📝', color: '#d4798a', bg: '#fdf2f8' },
  vocabulary: { icon: '🧠', color: '#f59e0b', bg: '#fffbeb' },
}

export default function MilestoneProgress({ skill }: { skill: string }) {
  const t = useTranslations('achievements')
  const [data, setData] = useState<ProgressData | null>(null)

  useEffect(() => {
    fetch('/api/achievements/progress')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && d[skill]) setData(d[skill]) })
      .catch(() => {})
  }, [skill])

  if (!data || data.next === null) return null

  const config = SKILL_CONFIG[skill] || SKILL_CONFIG.writing

  return (
    <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: config.bg, border: `1px solid ${config.color}20` }}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{config.icon}</span>
          <span className="text-xs font-semibold" style={{ color: config.color }}>
            {t('nextMilestone')}
          </span>
        </div>
        <span className="text-xs font-bold" style={{ color: config.color }}>
          {data.current}/{data.next}
        </span>
      </div>
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${config.color}20` }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${data.pct}%`, backgroundColor: config.color }}
        />
      </div>
    </div>
  )
}
