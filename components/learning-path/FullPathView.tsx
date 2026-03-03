'use client'

import { useRef, useEffect } from 'react'

interface DayEntry {
  day: number
  theme: string
  task1: { icon: string; title: string }
  task2: { icon: string; title: string }
  task1Done: boolean
  task2Done: boolean
  isToday: boolean
  isPast: boolean
}

export default function FullPathView({ days, currentDay }: { days: DayEntry[]; currentDay: number }) {
  const todayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  // Group by week
  const weeks: DayEntry[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-gray-800">Full 365-Day Path</h3>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> Done</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-600 inline-block" /> Today</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200 inline-block" /> Upcoming</span>
        </div>
      </div>

      <div className="max-h-[480px] overflow-y-auto space-y-3 pr-1">
        {weeks.map((week, wi) => (
          <div key={wi}>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Week {wi + 1}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-7 gap-1.5">
              {week.map((day) => {
                const bothDone = day.task1Done && day.task2Done
                const halfDone = day.task1Done || day.task2Done

                return (
                  <div
                    key={day.day}
                    ref={day.isToday ? todayRef : undefined}
                    className={`relative rounded-lg p-2.5 border-2 transition-all ${
                      day.isToday
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : bothDone
                        ? 'border-green-200 bg-green-50'
                        : halfDone
                        ? 'border-yellow-200 bg-yellow-50'
                        : day.isPast
                        ? 'border-gray-100 bg-gray-50 opacity-50'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    {day.isToday && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                        TODAY
                      </div>
                    )}
                    <div className={`text-xs font-bold mb-1 ${day.isToday ? 'text-blue-600' : 'text-gray-400'}`}>
                      Day {day.day}
                    </div>
                    <div className="space-y-0.5">
                      <div className={`text-xs flex items-center gap-1 ${day.task1Done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                        <span>{day.task1.icon}</span>
                        <span className="truncate">{day.task1.title}</span>
                        {day.task1Done && <span className="text-green-500 ml-auto">✓</span>}
                      </div>
                      <div className={`text-xs flex items-center gap-1 ${day.task2Done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                        <span>{day.task2.icon}</span>
                        <span className="truncate">{day.task2.title}</span>
                        {day.task2Done && <span className="text-green-500 ml-auto">✓</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
