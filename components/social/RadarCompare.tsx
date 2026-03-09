'use client'

import { useTranslations } from 'next-intl'

interface UserStats {
  id: string
  name: string
  level: string
  stats: Record<string, number>
  raw: Record<string, number>
}

interface Props {
  data: { me: UserStats; friend: UserStats }
  onClose: () => void
}

const AXES = [
  { key: 'writing', angle: -90 },
  { key: 'speaking', angle: -30 },
  { key: 'listening', angle: 30 },
  { key: 'vocabulary', angle: 90 },
  { key: 'consistency', angle: 150 },
  { key: 'streak', angle: 210 },
]

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function buildPath(cx: number, cy: number, stats: Record<string, number>, maxR: number) {
  return AXES.map((axis) => {
    const val = Math.min(100, stats[axis.key] || 0)
    const r = (val / 100) * maxR
    return polarToXY(cx, cy, r, axis.angle)
  })
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ') + ' Z'
}

export default function RadarCompare({ data, onClose }: Props) {
  const t = useTranslations('social')

  const cx = 150
  const cy = 150
  const maxR = 110
  const gridLevels = [25, 50, 75, 100]

  const mePath = buildPath(cx, cy, data.me.stats, maxR)
  const friendPath = buildPath(cx, cy, data.friend.stats, maxR)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">{t('compareTitle')}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-sm text-gray-700">{data.me.name} ({data.me.level})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span className="text-sm text-gray-700">{data.friend.name} ({data.friend.level})</span>
        </div>
      </div>

      {/* SVG Radar */}
      <div className="flex justify-center">
        <svg width="300" height="300" viewBox="0 0 300 300">
          {/* Grid hexagons */}
          {gridLevels.map((level) => {
            const r = (level / 100) * maxR
            const points = AXES.map((a) => {
              const p = polarToXY(cx, cy, r, a.angle)
              return `${p.x},${p.y}`
            }).join(' ')
            return (
              <polygon
                key={level}
                points={points}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth={level === 100 ? 1.5 : 0.5}
              />
            )
          })}

          {/* Axis lines */}
          {AXES.map((axis) => {
            const end = polarToXY(cx, cy, maxR, axis.angle)
            return <line key={axis.key} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="#e5e7eb" strokeWidth={0.5} />
          })}

          {/* Me polygon */}
          <path d={mePath} fill="rgba(59,130,246,0.2)" stroke="#3b82f6" strokeWidth={2} />
          {/* Friend polygon */}
          <path d={friendPath} fill="rgba(139,92,246,0.2)" stroke="#8b5cf6" strokeWidth={2} />

          {/* Dots and labels */}
          {AXES.map((axis) => {
            const meVal = Math.min(100, data.me.stats[axis.key] || 0)
            const friendVal = Math.min(100, data.friend.stats[axis.key] || 0)
            const meP = polarToXY(cx, cy, (meVal / 100) * maxR, axis.angle)
            const friendP = polarToXY(cx, cy, (friendVal / 100) * maxR, axis.angle)
            const labelP = polarToXY(cx, cy, maxR + 20, axis.angle)
            return (
              <g key={axis.key}>
                <circle cx={meP.x} cy={meP.y} r={4} fill="#3b82f6" />
                <circle cx={friendP.x} cy={friendP.y} r={4} fill="#8b5cf6" />
                <text
                  x={labelP.x}
                  y={labelP.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs fill-gray-500 font-medium"
                >
                  {t(`axis.${axis.key}`)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Stats table */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="text-xs font-medium text-gray-400">{t('skill')}</div>
        <div className="text-xs font-bold text-blue-600">{data.me.name}</div>
        <div className="text-xs font-bold text-purple-600">{data.friend.name}</div>
        {AXES.map((axis) => {
          const meVal = data.me.stats[axis.key] || 0
          const friendVal = data.friend.stats[axis.key] || 0
          return (
            <div key={axis.key} className="contents">
              <div className="text-xs text-gray-600 text-left pl-2">{t(`axis.${axis.key}`)}</div>
              <div className={`text-xs font-bold ${meVal >= friendVal ? 'text-blue-600' : 'text-gray-400'}`}>{meVal}</div>
              <div className={`text-xs font-bold ${friendVal >= meVal ? 'text-purple-600' : 'text-gray-400'}`}>{friendVal}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
