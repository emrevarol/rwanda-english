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
  color: string
}

function ColoredTick(props: any) {
  const { x, y, payload, index } = props
  // Access color from the data via the chart's data prop
  const colors = props.colors || []
  const color = colors[index] || '#374151'

  // Push labels outward from center
  const cx = props.cx || 0
  const cy = props.cy || 0
  const dx = x - cx
  const dy = y - cy
  const dist = Math.sqrt(dx * dx + dy * dy)
  const offset = 22
  const nx = x + (dx / dist) * offset
  const ny = y + (dy / dist) * offset

  // Determine text anchor based on position relative to center
  let anchor: 'start' | 'middle' | 'end' = 'middle'
  if (dx > 10) anchor = 'start'
  else if (dx < -10) anchor = 'end'

  return (
    <text
      x={nx}
      y={ny}
      textAnchor={anchor}
      dominantBaseline="central"
      fill={color}
      fontSize={11}
      fontWeight={600}
    >
      {payload.value}
    </text>
  )
}

export default function SkillsRadar({ data }: { data: SkillData[] }) {
  const colors = data.map(d => d.color)

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} outerRadius="58%">
        <PolarGrid />
        <PolarAngleAxis
          dataKey="subject"
          tick={(props: any) => <ColoredTick {...props} colors={colors} />}
          tickLine={false}
        />
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
