'use client'

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
  if (writingData.length === 0 && speakingData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
        No data yet. Start practicing to see your progress!
      </div>
    )
  }

  const maxLen = Math.max(writingData.length, speakingData.length)
  const combined = Array.from({ length: maxLen }, (_, i) => ({
    name: i + 1,
    Writing: writingData[i]?.score,
    Speaking: speakingData[i]?.score,
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={combined}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="Writing" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
        <Line type="monotone" dataKey="Speaking" stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
