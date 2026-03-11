'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { DayPlan } from '@/lib/learningPath'

const colorMap: Record<string, { bg: string; border: string; text: string; btn: string }> = {
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   btn: 'bg-blue-600 hover:bg-blue-700' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', btn: 'bg-indigo-600 hover:bg-indigo-700' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', btn: 'bg-purple-600 hover:bg-purple-700' },
  green:  { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  btn: 'bg-green-600 hover:bg-green-700' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', btn: 'bg-orange-600 hover:bg-orange-700' },
}

interface Props {
  plan: DayPlan
  progress: { task1Done: boolean; task2Done: boolean }
  onComplete: (task: 'task1' | 'task2') => void
  locale: string
}

export default function TodayCard({ plan, progress, onComplete, locale }: Props) {
  const router = useRouter()
  const t = useTranslations('learningPath')

  const handleStart = (href: string, task: 'task1' | 'task2') => {
    // Mark as done then navigate
    onComplete(task)
    router.push(`/${locale}${href}`)
  }

  const bothDone = progress.task1Done && progress.task2Done

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-blue-200 uppercase tracking-wide">{t('todaysFocus')}</div>
            <div className="text-lg font-bold mt-0.5">{plan.themeKey ? t(plan.themeKey) : plan.theme}</div>
          </div>
          {bothDone && (
            <div className="bg-white/20 text-white text-sm font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              {t('dayComplete')}
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-4">
        <TaskRow
          label={t('session1')}
          task={plan.task1}
          done={progress.task1Done}
          onStart={() => handleStart(plan.task1.href, 'task1')}
          t={t}
        />
        <div className="border-t border-dashed border-gray-200" />
        <TaskRow
          label={t('session2')}
          task={plan.task2}
          done={progress.task2Done}
          onStart={() => handleStart(plan.task2.href, 'task2')}
          t={t}
        />
      </div>

      {bothDone && (
        <div className="bg-green-50 border-t border-green-100 px-6 py-4 text-center">
          <p className="text-green-700 font-medium text-sm">
            {t('amazingWork')}
          </p>
        </div>
      )}
    </div>
  )
}

function TaskRow({
  label,
  task,
  done,
  onStart,
  t,
}: {
  label: string
  task: DayPlan['task1']
  done: boolean
  onStart: () => void
  t: ReturnType<typeof useTranslations>
}) {
  const c = colorMap[task.color] || colorMap.blue

  return (
    <div className={`rounded-xl border-2 p-4 transition-all ${done ? 'border-green-200 bg-green-50' : `${c.border} ${c.bg}`}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`text-2xl mt-0.5 ${done ? 'opacity-50' : ''}`}>{done ? '✅' : task.icon}</div>
          <div>
            <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-0.5">{label}</div>
            <div className={`font-semibold ${done ? 'text-gray-600 line-through' : 'text-gray-900'}`}>
              {t(task.titleKey)}
            </div>
            <div className={`text-sm mt-0.5 ${done ? 'text-gray-600' : 'text-gray-600'}`}>
              {task.description}
            </div>
          </div>
        </div>
        {done ? (
          <span className="flex-shrink-0 text-green-600 font-semibold text-sm whitespace-nowrap">{t('doneCheck')}</span>
        ) : (
          <button
            onClick={onStart}
            className={`flex-shrink-0 ${c.btn} text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap`}
          >
            {t('startBtn')}
          </button>
        )}
      </div>
    </div>
  )
}
