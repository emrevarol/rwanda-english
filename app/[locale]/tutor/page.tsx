'use client'

import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import Navigation from '@/components/shared/Navigation'
import ChatInterface from '@/components/tutor/ChatInterface'

export default function TutorPage() {
  const t = useTranslations('tutor')
  const { data: session, status } = useSession()

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">
          Please <Link href="/login" className="text-blue-600 hover:underline">login</Link> to chat with the AI tutor.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-500 text-sm">
            {t('subtitle')} — Level:{' '}
            <span className="font-medium text-blue-600">{session?.user?.level}</span>
          </p>
        </div>
        <div className="flex-1">
          <ChatInterface
            userName={session?.user?.name || 'Teacher'}
            userLevel={session?.user?.level || 'B1'}
          />
        </div>
      </div>
    </div>
  )
}
