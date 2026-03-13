'use client'

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts'

interface SkillData {
  subject: string
  value: number
}

export default function SkillsRadar({ data }: { data: SkillData[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} outerRadius="70%">
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#374151' }} tickLine={false} />
        <PolarRadiusAxis domain={[0, 100]} tickCount={6} tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} />
        <Radar
          name="Skills"
          dataKey="value"
          stroke="#2563eb"
          fill="#2563eb"
          fillOpacity={0.3}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
