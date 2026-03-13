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
  color?: string
}

const SKILL_COLORS: Record<string, string> = {
  Writing: '#2563eb',
  Speaking: '#16a34a',
  Listening: '#9333ea',
  Vocabulary: '#f59e0b',
  Grammar: '#ef4444',
  Vocab: '#f59e0b',
}

function ColoredTick({ x, y, payload }: { x: number; y: number; payload: { value: string } }) {
  const color = SKILL_COLORS[payload.value] || '#374151'
  return (
    <text x={x} y={y} textAnchor="middle" fill={color} fontSize={12} fontWeight={600}>
      {payload.value}
    </text>
  )
}

export default function SkillsRadar({ data }: { data: SkillData[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} outerRadius="70%">
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" tick={ColoredTick as any} tickLine={false} />
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
