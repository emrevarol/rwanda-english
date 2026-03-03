'use client'

import { useMemo } from 'react'

interface Day {
  date: string
  count: number // 0, 1, or 2
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS_OF_WEEK = ['','Mon','','Wed','','Fri','']

function getColor(count: number) {
  if (count === 0) return 'bg-gray-100'
  if (count === 1) return 'bg-blue-300'
  return 'bg-blue-600'
}

export default function ConsistencyChart({ days }: { days: Day[] }) {
  // Group into weeks (columns of 7)
  const weeks = useMemo(() => {
    const result: Day[][] = []
    // Pad start so first day aligns to correct weekday
    const firstDay = days[0] ? new Date(days[0].date).getDay() : 0
    const padded: (Day | null)[] = Array(firstDay).fill(null).concat(days as any)
    for (let i = 0; i < padded.length; i += 7) {
      result.push(padded.slice(i, i + 7) as Day[])
    }
    return result
  }, [days])

  // Month labels
  const monthLabels = useMemo(() => {
    const labels: { month: string; col: number }[] = []
    let lastMonth = -1
    weeks.forEach((week, col) => {
      const realDays = week.filter(Boolean) as Day[]
      if (realDays.length > 0) {
        const month = new Date(realDays[0].date).getMonth()
        if (month !== lastMonth) {
          labels.push({ month: MONTHS[month], col })
          lastMonth = month
        }
      }
    })
    return labels
  }, [weeks])

  const totalDone = days.filter(d => d.count > 0).length
  const fullDays = days.filter(d => d.count === 2).length

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Consistency</h3>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span><span className="font-semibold text-blue-600">{totalDone}</span> active days</span>
          <span><span className="font-semibold text-blue-600">{fullDays}</span> full days</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex gap-1 min-w-max">
          {/* Day-of-week labels */}
          <div className="flex flex-col gap-0.5 mr-1">
            {DAYS_OF_WEEK.map((d, i) => (
              <div key={i} className="h-[11px] text-[9px] text-gray-400 leading-[11px] text-right pr-1">
                {d}
              </div>
            ))}
          </div>

          {/* Week columns */}
          <div>
            {/* Month labels row */}
            <div className="flex gap-0.5 mb-1 h-3">
              {weeks.map((_, col) => {
                const label = monthLabels.find(l => l.col === col)
                return (
                  <div key={col} className="w-[11px] text-[9px] text-gray-400 text-center">
                    {label ? label.month : ''}
                  </div>
                )
              })}
            </div>

            {/* Grid */}
            <div className="flex gap-0.5">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-0.5">
                  {Array.from({ length: 7 }, (_, di) => {
                    const day = week[di]
                    if (!day) return <div key={di} className="w-[11px] h-[11px]" />
                    const isToday = day.date === new Date().toISOString().split('T')[0]
                    return (
                      <div
                        key={di}
                        title={`${day.date}: ${day.count === 0 ? 'No sessions' : day.count === 1 ? '1 session' : '2 sessions completed'}`}
                        className={`w-[11px] h-[11px] rounded-sm ${getColor(day.count)} ${isToday ? 'ring-1 ring-blue-500 ring-offset-0.5' : ''} cursor-default transition-opacity hover:opacity-75`}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
        <span>Less</span>
        <div className="w-[11px] h-[11px] rounded-sm bg-gray-100" />
        <div className="w-[11px] h-[11px] rounded-sm bg-blue-300" />
        <div className="w-[11px] h-[11px] rounded-sm bg-blue-600" />
        <span>More</span>
      </div>
    </div>
  )
}
