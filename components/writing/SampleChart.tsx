'use client'

import { useMemo } from 'react'

// Deterministic random based on seed
function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

interface Props {
  prompt: string
}

export default function SampleChart({ prompt }: Props) {
  const lower = prompt.toLowerCase()

  const chartType = useMemo(() => {
    if (lower.includes('pie chart') || lower.includes('preferred')) return 'pie'
    if (lower.includes('bar chart') || lower.includes('bar') || lower.includes('compare')) return 'bar'
    if (lower.includes('table')) return 'table'
    if (lower.includes('line graph') || lower.includes('trends') || lower.includes('changes') || lower.includes('multi-line')) return 'line'
    return 'bar' // default
  }, [lower])

  const seed = useMemo(() => {
    let h = 0
    for (let i = 0; i < prompt.length; i++) h = (h * 31 + prompt.charCodeAt(i)) | 0
    return Math.abs(h) || 1
  }, [prompt])

  const rand = seededRandom(seed)

  if (chartType === 'pie') return <PieChart rand={rand} />
  if (chartType === 'line') return <LineChart rand={rand} />
  if (chartType === 'table') return <TableChart rand={rand} />
  return <BarChart rand={rand} />
}

function PieChart({ rand }: { rand: () => number }) {
  const categories = ['Mathematics', 'English', 'Science', 'Social Studies', 'Kinyarwanda']
  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']
  const values = categories.map(() => 10 + Math.floor(rand() * 30))
  const total = values.reduce((a, b) => a + b, 0)

  let cumAngle = 0
  const slices = values.map((v, i) => {
    const angle = (v / total) * 360
    const startAngle = cumAngle
    cumAngle += angle
    const startRad = ((startAngle - 90) * Math.PI) / 180
    const endRad = ((startAngle + angle - 90) * Math.PI) / 180
    const largeArc = angle > 180 ? 1 : 0
    const x1 = 100 + 80 * Math.cos(startRad)
    const y1 = 100 + 80 * Math.sin(startRad)
    const x2 = 100 + 80 * Math.cos(endRad)
    const y2 = 100 + 80 * Math.sin(endRad)
    const midRad = ((startAngle + angle / 2 - 90) * Math.PI) / 180
    const labelX = 100 + 55 * Math.cos(midRad)
    const labelY = 100 + 55 * Math.sin(midRad)
    const pct = Math.round((v / total) * 100)
    return { d: `M100,100 L${x1},${y1} A80,80 0 ${largeArc},1 ${x2},${y2} Z`, color: colors[i], label: categories[i], pct, labelX, labelY }
  })

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">📊 Sample Data</div>
      <div className="text-sm font-medium text-gray-700 mb-3">Subjects Preferred by Students (%)</div>
      <div className="flex items-center justify-center gap-6">
        <svg width="200" height="200" viewBox="0 0 200 200">
          {slices.map((s, i) => (
            <g key={i}>
              <path d={s.d} fill={s.color} stroke="white" strokeWidth="2" />
              <text x={s.labelX} y={s.labelY} textAnchor="middle" dominantBaseline="middle" className="text-[10px] fill-white font-bold">
                {s.pct}%
              </text>
            </g>
          ))}
        </svg>
        <div className="space-y-1.5">
          {slices.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: s.color }} />
              <span className="text-gray-600">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function BarChart({ rand }: { rand: () => number }) {
  const countries = ['USA', 'UK', 'Germany', 'Japan', 'Brazil']
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']
  const data2018 = countries.map(() => 40 + Math.floor(rand() * 40))
  const data2023 = countries.map((_, i) => Math.min(95, data2018[i] + 5 + Math.floor(rand() * 20)))
  const maxVal = Math.max(...data2023) + 10

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">📊 Sample Data</div>
      <div className="text-sm font-medium text-gray-700 mb-3">Literacy Rates by Country (2018 vs 2023)</div>
      <svg width="100%" height="200" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
        {/* Y axis */}
        {[0, 25, 50, 75, 100].map((v) => {
          const y = 180 - (v / maxVal) * 160
          return (
            <g key={v}>
              <line x1="50" y1={y} x2="380" y2={y} stroke="#e5e7eb" strokeWidth="0.5" />
              <text x="45" y={y + 3} textAnchor="end" className="text-[9px] fill-gray-600">{v}%</text>
            </g>
          )
        })}
        {/* Bars */}
        {countries.map((c, i) => {
          const x = 60 + i * 65
          const h1 = (data2018[i] / maxVal) * 160
          const h2 = (data2023[i] / maxVal) * 160
          return (
            <g key={c}>
              <rect x={x} y={180 - h1} width={20} height={h1} fill={colors[i]} opacity={0.4} rx={2} />
              <rect x={x + 22} y={180 - h2} width={20} height={h2} fill={colors[i]} rx={2} />
              <text x={x + 20} y={195} textAnchor="middle" className="text-[9px] fill-gray-500">{c}</text>
            </g>
          )
        })}
        {/* Legend */}
        <rect x="290" y="5" width="10" height="10" fill="#999" opacity={0.4} rx={1} />
        <text x="305" y="14" className="text-[9px] fill-gray-500">2018</text>
        <rect x="340" y="5" width="10" height="10" fill="#999" rx={1} />
        <text x="355" y="14" className="text-[9px] fill-gray-500">2023</text>
      </svg>
    </div>
  )
}

function LineChart({ rand }: { rand: () => number }) {
  const years = [2018, 2019, 2020, 2021, 2022, 2023]
  const lines = [
    { label: 'Primary', color: '#3b82f6', data: [] as number[] },
    { label: 'Secondary', color: '#10b981', data: [] as number[] },
    { label: 'Tertiary', color: '#f59e0b', data: [] as number[] },
  ]

  let base = [60 + Math.floor(rand() * 20), 30 + Math.floor(rand() * 20), 10 + Math.floor(rand() * 10)]
  for (let y = 0; y < years.length; y++) {
    lines.forEach((l, i) => {
      base[i] = Math.min(95, base[i] + Math.floor(rand() * 8))
      l.data.push(base[i])
    })
  }

  const maxVal = 100
  const getX = (i: number) => 60 + i * 55
  const getY = (v: number) => 170 - (v / maxVal) * 150

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">📊 Sample Data</div>
      <div className="text-sm font-medium text-gray-700 mb-3">Student Enrollment Trends (2018–2023)</div>
      <svg width="100%" height="200" viewBox="0 0 380 200" preserveAspectRatio="xMidYMid meet">
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line x1="50" y1={getY(v)} x2="370" y2={getY(v)} stroke="#e5e7eb" strokeWidth="0.5" />
            <text x="45" y={getY(v) + 3} textAnchor="end" className="text-[9px] fill-gray-600">{v}%</text>
          </g>
        ))}
        {years.map((yr, i) => (
          <text key={yr} x={getX(i)} y={190} textAnchor="middle" className="text-[9px] fill-gray-500">{yr}</text>
        ))}
        {lines.map((l) => (
          <g key={l.label}>
            <polyline
              points={l.data.map((v, i) => `${getX(i)},${getY(v)}`).join(' ')}
              fill="none" stroke={l.color} strokeWidth="2"
            />
            {l.data.map((v, i) => (
              <circle key={i} cx={getX(i)} cy={getY(v)} r="3" fill={l.color} />
            ))}
          </g>
        ))}
        {lines.map((l, i) => (
          <g key={l.label}>
            <rect x={280} y={5 + i * 16} width="10" height="10" fill={l.color} rx={2} />
            <text x={295} y={13 + i * 16} className="text-[9px] fill-gray-500">{l.label}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function TableChart({ rand }: { rand: () => number }) {
  const years = ['2020', '2021', '2022', '2023']
  const rows = years.map((y) => ({
    year: y,
    students: 200 + Math.floor(rand() * 300),
    attendance: 70 + Math.floor(rand() * 25),
    passRate: 50 + Math.floor(rand() * 40),
  }))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">📊 Sample Data</div>
      <div className="text-sm font-medium text-gray-700 mb-3">School Attendance Data (2020–2023)</div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 text-xs font-semibold text-gray-500">Year</th>
            <th className="text-right py-2 text-xs font-semibold text-gray-500">Students</th>
            <th className="text-right py-2 text-xs font-semibold text-gray-500">Attendance %</th>
            <th className="text-right py-2 text-xs font-semibold text-gray-500">Pass Rate %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.year} className="border-b border-gray-100">
              <td className="py-2 text-gray-700 font-medium">{r.year}</td>
              <td className="py-2 text-right text-gray-600">{r.students}</td>
              <td className="py-2 text-right text-gray-600">{r.attendance}%</td>
              <td className="py-2 text-right text-gray-600">{r.passRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
