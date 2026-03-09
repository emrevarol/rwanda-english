'use client'

import { useMemo, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'

interface Day {
  date: string
  count: number // 0, 1, or 2
}

interface DayDetail {
  date: string
  progress: { task1Done: boolean; task2Done: boolean; task1Type: string; task2Type: string; task1Mins: number; task2Mins: number } | null
  activities: {
    writing: Array<{ type: string; band: number; time: string }>
    speaking: Array<{ score: number; time: string }>
    listening: Array<{ score: number; time: string }>
    chatMessages: number
  }
  totalMins: number
}

function getColor(count: number) {
  if (count === -1) return 'bg-gray-50' // before registration
  if (count === 0) return 'bg-gray-100'
  if (count === 1) return 'bg-blue-300'
  return 'bg-blue-600'
}

export default function ConsistencyChart({ days }: { days: Day[] }) {
  const t = useTranslations('learningPath')
  const locale = useLocale()
  const [selectedDay, setSelectedDay] = useState<DayDetail | null>(null)
  const [loadingDay, setLoadingDay] = useState<string | null>(null)

  const MONTHS = useMemo(() =>
    Array.from({ length: 12 }, (_, i) =>
      new Date(2024, i, 1).toLocaleDateString(locale, { month: 'short' })
    ), [locale])

  const DAYS_OF_WEEK = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2024, 0, i)
      return d.toLocaleDateString(locale, { weekday: 'short' })
    })
    return days.map((d, i) => (i === 1 || i === 3 || i === 5) ? d : '')
  }, [locale])

  const weeks = useMemo(() => {
    const result: Day[][] = []
    const firstDay = days[0] ? new Date(days[0].date).getDay() : 0
    const padded: (Day | null)[] = Array(firstDay).fill(null).concat(days as any)
    for (let i = 0; i < padded.length; i += 7) {
      result.push(padded.slice(i, i + 7) as Day[])
    }
    return result
  }, [days])

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
  }, [weeks, MONTHS])

  const activeDays = days.filter(d => d.count >= 0) // exclude pre-registration
  const totalDone = activeDays.filter(d => d.count > 0).length
  const fullDays = activeDays.filter(d => d.count === 2).length

  const handleDayClick = async (day: Day) => {
    if (loadingDay) return
    setLoadingDay(day.date)
    try {
      const res = await fetch(`/api/learning-path/day-detail?date=${day.date}`)
      if (res.ok) {
        setSelectedDay(await res.json())
      }
    } catch {}
    setLoadingDay(null)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">{t('consistency')}</h3>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span><span className="font-semibold text-blue-600">{totalDone}</span> {t('activeDays', { count: totalDone }).replace(String(totalDone), '').trim()}</span>
          <span><span className="font-semibold text-blue-600">{fullDays}</span> {t('fullDays', { count: fullDays }).replace(String(fullDays), '').trim()}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex gap-1 min-w-max">
          <div className="flex flex-col gap-0.5 mr-1">
            {DAYS_OF_WEEK.map((d, i) => (
              <div key={i} className="h-[11px] text-[9px] text-gray-400 leading-[11px] text-right pr-1">
                {d}
              </div>
            ))}
          </div>

          <div>
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

            <div className="flex gap-0.5">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-0.5">
                  {Array.from({ length: 7 }, (_, di) => {
                    const day = week[di]
                    if (!day) return <div key={di} className="w-[11px] h-[11px]" />
                    const isToday = day.date === new Date().toISOString().split('T')[0]
                    const isSelected = selectedDay?.date === day.date
                    const isPreReg = day.count === -1
                    return (
                      <div
                        key={di}
                        onClick={() => !isPreReg && handleDayClick(day)}
                        title={isPreReg ? t('beforeJoin') : undefined}
                        className={`w-[11px] h-[11px] rounded-sm ${getColor(day.count)} ${
                          isToday ? 'ring-1 ring-blue-500 ring-offset-0.5' : ''
                        } ${isSelected ? 'ring-1 ring-yellow-500 ring-offset-0.5' : ''} ${
                          loadingDay === day.date ? 'animate-pulse' : ''
                        } ${isPreReg ? 'cursor-default opacity-30' : 'cursor-pointer'} transition-opacity hover:opacity-75`}
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
        <span>{t('less')}</span>
        <div className="w-[11px] h-[11px] rounded-sm bg-gray-100" />
        <div className="w-[11px] h-[11px] rounded-sm bg-blue-300" />
        <div className="w-[11px] h-[11px] rounded-sm bg-blue-600" />
        <span>{t('more')}</span>
        <span className="ml-2 text-gray-300">|</span>
        <span className="text-gray-400">{t('clickForDetail')}</span>
      </div>

      {/* Day detail popup */}
      {selectedDay && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 animate-in">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-blue-800">
              {new Date(selectedDay.date).toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h4>
            <button onClick={() => setSelectedDay(null)} className="text-blue-400 hover:text-blue-600 text-lg">×</button>
          </div>

          {/* Tasks */}
          {selectedDay.progress ? (
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className={`rounded-lg p-3 ${selectedDay.progress.task1Done ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                <div className="text-xs font-medium text-gray-500 mb-1">{t('session1')}</div>
                <div className="text-sm font-semibold text-gray-800">{selectedDay.progress.task1Type || '—'}</div>
                <div className="flex items-center gap-2 mt-1">
                  {selectedDay.progress.task1Done ? (
                    <span className="text-xs text-green-600">✓ {t('doneCheck')}</span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                  {selectedDay.progress.task1Mins > 0 && (
                    <span className="text-xs text-blue-600">{selectedDay.progress.task1Mins} {t('minutes')}</span>
                  )}
                </div>
              </div>
              <div className={`rounded-lg p-3 ${selectedDay.progress.task2Done ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                <div className="text-xs font-medium text-gray-500 mb-1">{t('session2')}</div>
                <div className="text-sm font-semibold text-gray-800">{selectedDay.progress.task2Type || '—'}</div>
                <div className="flex items-center gap-2 mt-1">
                  {selectedDay.progress.task2Done ? (
                    <span className="text-xs text-green-600">✓ {t('doneCheck')}</span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                  {selectedDay.progress.task2Mins > 0 && (
                    <span className="text-xs text-blue-600">{selectedDay.progress.task2Mins} {t('minutes')}</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 mb-3">{t('noSessions')}</p>
          )}

          {/* Activities */}
          <div className="space-y-1.5">
            {selectedDay.activities.writing.length > 0 && (
              <div className="text-xs text-gray-600">
                ✍️ {selectedDay.activities.writing.length} {t('writingActivity')} — {t('avgBand')}: {(selectedDay.activities.writing.reduce((s, w) => s + w.band, 0) / selectedDay.activities.writing.length).toFixed(1)}
              </div>
            )}
            {selectedDay.activities.listening.length > 0 && (
              <div className="text-xs text-gray-600">
                🎧 {selectedDay.activities.listening.length} {t('listeningActivity')} — {t('avgScore')}: {Math.round(selectedDay.activities.listening.reduce((s, l) => s + l.score, 0) / selectedDay.activities.listening.length)}%
              </div>
            )}
            {selectedDay.activities.chatMessages > 0 && (
              <div className="text-xs text-gray-600">
                🤖 {selectedDay.activities.chatMessages} {t('chatActivity')}
              </div>
            )}
            {selectedDay.totalMins > 0 && (
              <div className="text-xs font-medium text-blue-700 mt-2">
                ⏱ {t('totalTime')}: {selectedDay.totalMins} {t('minutes')}
              </div>
            )}
            {selectedDay.activities.writing.length === 0 && selectedDay.activities.listening.length === 0 && selectedDay.activities.chatMessages === 0 && !selectedDay.progress && (
              <div className="text-xs text-gray-400">{t('noActivityDay')}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
