'use client'

import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { useTranslations } from 'next-intl'

interface ToastItem {
  key: string
  icon: string
  id: number
}

const AchievementContext = createContext<{
  showAchievements: (achievements: Array<{ key: string; icon: string }>) => void
}>({ showAchievements: () => {} })

export function useAchievementToast() {
  return useContext(AchievementContext)
}

export function AchievementProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  let counter = 0

  const showAchievements = useCallback((achievements: Array<{ key: string; icon: string }>) => {
    if (!achievements || achievements.length === 0) return
    const newToasts = achievements.map(a => ({ ...a, id: ++counter }))
    setToasts(prev => [...prev, ...newToasts])
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <AchievementContext.Provider value={{ showAchievements }}>
      {children}
      <div className="fixed top-20 right-4 z-[60] space-y-2">
        {toasts.map(toast => (
          <AchievementToastItem key={toast.id} toast={toast} onDone={() => removeToast(toast.id)} />
        ))}
      </div>
    </AchievementContext.Provider>
  )
}

function AchievementToastItem({ toast, onDone }: { toast: ToastItem; onDone: () => void }) {
  const t = useTranslations('achievements')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 300)
    }, 5000)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border transition-all duration-300 ${
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
      }`}
      style={{ backgroundColor: '#1e293b', borderColor: '#475569' }}
    >
      <span className="text-2xl">{toast.icon}</span>
      <div>
        <div className="text-xs font-bold text-amber-400">{t('newUnlock')}</div>
        <div className="text-sm font-medium text-white">{t(toast.key)}</div>
      </div>
    </div>
  )
}
