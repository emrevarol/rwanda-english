'use client'

import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import Navigation from '@/components/shared/Navigation'
import ListeningPlayer from '@/components/listening/ListeningPlayer'

export default function ListeningPage() {
  const t = useTranslations('listening')
  const { data: session, status } = useSession()

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">
          Please <Link href="/login" className="text-blue-600 hover:underline">login</Link> to practice listening.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-500 text-sm mt-1">
            Level: <span className="font-medium text-blue-600">{session?.user?.level}</span>
          </p>
        </div>
        <ListeningPlayer />
      </div>
    </div>
  )
}
