'use client'

import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import Navigation from '@/components/shared/Navigation'
import VocabularyBuilder from '@/components/vocabulary/VocabularyBuilder'

export default function VocabularyPage() {
  const t = useTranslations('vocabulary')
  const tc = useTranslations('common')
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') || undefined

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">{t('loginMessage')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-gray-500 text-sm">
            {t('subtitle')} — {tc('level')}:{' '}
            <span className="font-medium text-blue-600">{session?.user?.level}</span>
          </p>
        </div>
        <VocabularyBuilder userLevel={session?.user?.level || 'B1'} initialCategory={initialCategory} />
      </div>
    </div>
  )
}
