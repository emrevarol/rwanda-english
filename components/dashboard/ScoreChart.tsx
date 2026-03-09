'use client'

import { useTranslations, useLocale } from 'next-intl'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface ScoreEntry {
  date: string
  score: number
}

interface Props {
  writingData: ScoreEntry[]
  speakingData: ScoreEntry[]
}

export default function ScoreChart({ writingData, speakingData }: Props) {
  const t = useTranslations('dashboard')
  const locale = useLocale()

  if (writingData.length === 0 && speakingData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
        {t('noDataYet')}
      </div>
    )
  }

  // Merge all dates and create a timeline
  const allEntries: Array<{ date: string; writing?: number; speaking?: number }> = []
  const dateMap = new Map<string, { writing?: number; speaking?: number }>()

  for (const w of writingData) {
    const dateStr = new Date(w.date).toLocaleDateString(locale, { day: 'numeric', month: 'short' })
    const existing = dateMap.get(dateStr) || {}
    existing.writing = w.score
    dateMap.set(dateStr, existing)
  }
  for (const s of speakingData) {
    const dateStr = new Date(s.date).toLocaleDateString(locale, { day: 'numeric', month: 'short' })
    const existing = dateMap.get(dateStr) || {}
    existing.speaking = s.score
    dateMap.set(dateStr, existing)
  }

  for (const [date, scores] of dateMap) {
    allEntries.push({ date, ...scores })
  }

  // Sort by original date
  const allDates = [...writingData.map(w => w.date), ...speakingData.map(s => s.date)].sort()
  const sortedEntries = allEntries.sort((a, b) => {
    const aIdx = allDates.findIndex(d => new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'short' }) === a.date)
    const bIdx = allDates.findIndex(d => new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'short' }) === b.date)
    return aIdx - bIdx
  })

  const writingLabel = t('writing')
  const speakingLabel = t('speaking')

  const combined = sortedEntries.map((entry) => ({
    date: entry.date,
    [writingLabel]: entry.writing,
    [speakingLabel]: entry.speaking,
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={combined}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          angle={-30}
          textAnchor="end"
          height={45}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          domain={[0, 'auto']}
          label={{ value: t('bandScore'), angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#9ca3af' } }}
        />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey={writingLabel} stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} connectNulls />
        <Line type="monotone" dataKey={speakingLabel} stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  )
}
