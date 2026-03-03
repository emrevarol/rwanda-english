'use client'

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts'

interface SkillData {
  subject: string
  value: number
}

export default function SkillsRadar({ data }: { data: SkillData[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
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
