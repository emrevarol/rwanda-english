import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import SessionProviderWrapper from '@/components/shared/SessionProviderWrapper'
import { AchievementProvider } from '@/components/shared/AchievementToast'

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      <SessionProviderWrapper>
        <AchievementProvider>{children}</AchievementProvider>
      </SessionProviderWrapper>
    </NextIntlClientProvider>
  )
}
