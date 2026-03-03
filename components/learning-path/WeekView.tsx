'use client'

import { getDayPlan } from '@/lib/learningPath'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function WeekView({ dayNumber, level }: { dayNumber: number; level: string }) {
  // Show current week (7 days centered around today)
  const weekStart = Math.max(1, dayNumber - ((dayNumber - 1) % 7))
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = weekStart + i
    if (d > 365) return null
    return { dayNum: d, plan: getDayPlan(d, level), isToday: d === dayNumber }
  }).filter(Boolean) as Array<{ dayNum: number; plan: ReturnType<typeof getDayPlan>; isToday: boolean }>

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">This Week</h3>
        <span className="text-xs text-gray-400">Week {days[0]?.plan.week}</span>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map(({ dayNum, plan, isToday }, i) => (
          <div key={dayNum} className="text-center">
            <div className="text-xs text-gray-400 mb-1.5">{DAYS[i]}</div>
            <div
              className={`rounded-lg p-2 ${
                isToday
                  ? 'bg-blue-600 text-white shadow-md'
                  : dayNum < dayNum
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-gray-50 text-gray-600 border border-gray-100'
              }`}
            >
              <div className="text-base leading-none mb-1">{plan.task1.icon}</div>
              <div className="text-base leading-none">{plan.task2.icon}</div>
              <div className={`text-xs mt-1 font-medium ${isToday ? 'text-blue-100' : 'text-gray-400'}`}>
                {dayNum}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-600 rounded-full inline-block"></span>Today</div>
        <div className="flex items-center gap-1">✍️ Writing</div>
        <div className="flex items-center gap-1">🎧 Listening</div>
        <div className="flex items-center gap-1">🤖 Tutor</div>
        <div className="flex items-center gap-1">📚 Vocab</div>
      </div>
    </div>
  )
}
