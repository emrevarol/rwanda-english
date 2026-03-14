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
  listeningData?: ScoreEntry[]
  vocabData?: ScoreEntry[]
  grammarData?: ScoreEntry[]
}

export default function ScoreChart({ writingData, speakingData, listeningData = [], vocabData = [], grammarData = [] }: Props) {
  const t = useTranslations('dashboard')
  const locale = useLocale()

  if (writingData.length === 0 && speakingData.length === 0 && listeningData.length === 0 && vocabData.length === 0 && grammarData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
        {t('noDataYet')}
      </div>
    )
  }

  // Merge all dates and create a timeline
  const dateMap = new Map<string, { writing?: number; speaking?: number; listening?: number; vocab?: number; grammar?: number }>()

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
  for (const l of listeningData) {
    const dateStr = new Date(l.date).toLocaleDateString(locale, { day: 'numeric', month: 'short' })
    const existing = dateMap.get(dateStr) || {}
    existing.listening = l.score
    dateMap.set(dateStr, existing)
  }
  for (const v of vocabData) {
    const dateStr = new Date(v.date).toLocaleDateString(locale, { day: 'numeric', month: 'short' })
    const existing = dateMap.get(dateStr) || {}
    existing.vocab = v.score
    dateMap.set(dateStr, existing)
  }
  for (const g of grammarData) {
    const dateStr = new Date(g.date).toLocaleDateString(locale, { day: 'numeric', month: 'short' })
    const existing = dateMap.get(dateStr) || {}
    existing.grammar = g.score
    dateMap.set(dateStr, existing)
  }

  const allEntries: Array<{ date: string; writing?: number; speaking?: number; listening?: number; vocab?: number; grammar?: number }> = []
  for (const [date, scores] of dateMap) {
    allEntries.push({ date, ...scores })
  }

  // Sort by original date
  const allDates = [
    ...writingData.map(w => w.date),
    ...speakingData.map(s => s.date),
    ...listeningData.map(l => l.date),
    ...vocabData.map(v => v.date),
    ...grammarData.map(g => g.date),
  ].sort()
  const sortedEntries = allEntries.sort((a, b) => {
    const aIdx = allDates.findIndex(d => new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'short' }) === a.date)
    const bIdx = allDates.findIndex(d => new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'short' }) === b.date)
    return aIdx - bIdx
  })

  const writingLabel = t('writing')
  const speakingLabel = t('speaking')
  const listeningLabel = t('listening')
  const vocabLabel = t('vocabulary')
  const grammarLabel = t('grammar')

  const combined = sortedEntries.map((entry) => ({
    date: entry.date,
    [writingLabel]: entry.writing != null ? Math.round((entry.writing / 9) * 100) / 10 : undefined,
    [speakingLabel]: entry.speaking,
    [listeningLabel]: entry.listening != null ? Math.round(entry.listening) / 10 : undefined,
    [vocabLabel]: entry.vocab != null ? Math.round(entry.vocab * 10) / 10 : undefined,
    [grammarLabel]: entry.grammar != null ? Math.round((entry.grammar / 9) * 100) / 10 : undefined,
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
          domain={[0, 10]}
        />
        <Tooltip formatter={(value) => [`${value}/10`]} />
        <Legend />
        <Line type="monotone" dataKey={writingLabel} stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} connectNulls />
        <Line type="monotone" dataKey={speakingLabel} stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} connectNulls />
        <Line type="monotone" dataKey={listeningLabel} stroke="#9333ea" strokeWidth={2} dot={{ r: 4 }} connectNulls />
        <Line type="monotone" dataKey={vocabLabel} stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} connectNulls />
        <Line type="monotone" dataKey={grammarLabel} stroke="#d4798a" strokeWidth={2} dot={{ r: 4 }} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  )
}
