'use client'

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
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
  const offset = 14
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
      fontSize={13}
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
      <RadarChart data={data} outerRadius="52%">
        <PolarGrid />
        <PolarAngleAxis
          dataKey="subject"
          tick={(props: any) => <ColoredTick {...props} colors={colors} />}
          tickLine={false}
        />
        <PolarRadiusAxis domain={[0, 10]} tickCount={6} tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length > 0) {
              const d = payload[0].payload as SkillData
              return (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 shadow-md">
                  <div className="text-xs font-semibold" style={{ color: d.color }}>{d.subject}</div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">{d.value.toFixed(1)}/10</div>
                </div>
              )
            }
            return null
          }}
        />
        <Radar
          name="Skills"
          dataKey="value"
          stroke="#0284c7"
          fill="#0284c7"
          fillOpacity={0.3}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
