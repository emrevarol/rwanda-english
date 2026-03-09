'use client'

import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { Link } from '@/i18n/navigation'
import Navigation from '@/components/shared/Navigation'

export default function HomePage() {
  const t = useTranslations('landing')
  const tc = useTranslations('nav')
  const { data: session } = useSession()
  const actionHref = session ? '/dashboard' : '/register'

  const cefrLevels = [
    { level: 'A1', label: t('cefr.a1'), color: 'bg-red-100 text-red-700 border-red-200' },
    { level: 'A2', label: t('cefr.a2'), color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { level: 'B1', label: t('cefr.b1'), color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { level: 'B2', label: t('cefr.b2'), color: 'bg-green-100 text-green-700 border-green-200' },
    { level: 'C1', label: t('cefr.c1'), color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { level: 'C2', label: t('cefr.c2'), color: 'bg-purple-100 text-purple-700 border-purple-200' },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-600 to-purple-700 text-white animate-gradient">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-300 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-yellow-200 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl opacity-30" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-full mb-6 border border-white/20">
                <span>💰</span>
                <span>{t('hero.badge')}</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
                {t('hero.titleBefore')}{' '}
                <span className="text-yellow-300">{t('hero.titleHighlight')}</span>
              </h1>
              <p className="text-lg text-blue-100 mb-8 leading-relaxed max-w-lg">
                {t('hero.subtitle')}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href={actionHref}
                  className="bg-yellow-400 text-blue-900 text-base font-bold px-7 py-3.5 rounded-xl hover:bg-yellow-300 transition-all shadow-lg"
                >
                  {t('hero.cta')}
                </Link>
                <Link
                  href="/login"
                  className="bg-white/10 border border-white/30 text-white text-base font-medium px-7 py-3.5 rounded-xl hover:bg-white/20 transition-all"
                >
                  {t('hero.login')}
                </Link>
              </div>
              <div className="mt-10 flex items-center gap-6 text-sm text-blue-200">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-300 font-bold text-lg">365</span>
                  <span>{t('hero.dayProgram')}</span>
                </div>
                <div className="w-px h-6 bg-white/20" />
                <div className="flex items-center gap-2">
                  <span className="text-yellow-300 font-bold text-lg">30</span>
                  <span>{t('hero.minDay')}</span>
                </div>
                <div className="w-px h-6 bg-white/20" />
                <div className="flex items-center gap-2">
                  <span className="text-yellow-300 font-bold text-lg">A1→C2</span>
                  <span>CEFR</span>
                </div>
              </div>
            </div>

            {/* Hero image */}
            <div className="hidden lg:block relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 h-80">
                <img
                  src="https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&w=800&q=80"
                  alt="People learning English"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent" />
              </div>
              {/* Floating stats card */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl">🔥</div>
                <div>
                  <div className="text-xs text-gray-400">{t('hero.streakLabel')}</div>
                  <div className="text-lg font-bold text-gray-800">{t('hero.streakDays')}</div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">📈</div>
                <div>
                  <div className="text-xs text-gray-400">{t('hero.levelUpLabel')}</div>
                  <div className="text-lg font-bold text-gray-800">A2 → B1</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">{t('howItWorks.title')}</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              {t('howItWorks.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard step="01" icon="📝" title={t('howItWorks.step1Title')} description={t('howItWorks.step1Desc')} color="blue" />
            <StepCard step="02" icon="🗓" title={t('howItWorks.step2Title')} description={t('howItWorks.step2Desc')} color="green" />
            <StepCard step="03" icon="📊" title={t('howItWorks.step3Title')} description={t('howItWorks.step3Desc')} color="purple" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">{t('features.title')}</h2>
            <p className="text-gray-500 mt-3">{t('features.subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FeatureBig
              icon="✍️"
              title={t('features.writing.title')}
              description={t('features.writing.description')}
              image="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80"
              color="blue"
              href={actionHref}
            />
            <FeatureBig
              icon="🎧"
              title={t('features.listening.title')}
              description={t('features.listening.description')}
              image="https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=600&q=80"
              color="purple"
              href={actionHref}
            />
            <FeatureBig
              icon="🤖"
              title={t('features.tutor.title')}
              description={t('features.tutor.description')}
              image="https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&w=600&q=80"
              color="green"
              href={actionHref}
            />
            <FeatureBig
              icon="🎙️"
              title={t('features.speaking.title')}
              description={t('features.speaking.description')}
              image="https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=600&q=80"
              color="orange"
              href={actionHref}
            />
          </div>
        </div>
      </section>

      {/* CEFR levels */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('cefr.title')}</h2>
          <p className="text-gray-500 mb-10">{t('cefr.subtitle')}</p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {cefrLevels.map((l) => (
              <div key={l.level} className={`rounded-xl border-2 p-4 ${l.color}`}>
                <div className="text-2xl font-extrabold">{l.level}</div>
                <div className="text-xs mt-1 font-medium">{l.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">{t('pricing.title')}</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">{t('pricing.subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col">
              <div className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">{t('pricing.free')}</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold text-gray-900">$0</span>
              </div>
              <div className="text-sm text-gray-400 mb-6">{t('pricing.freePeriod')}</div>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-2 text-sm text-gray-600"><span className="text-green-500">✓</span>{t('pricing.freeFeature1')}</li>
                <li className="flex items-center gap-2 text-sm text-gray-600"><span className="text-green-500">✓</span>{t('pricing.freeFeature2')}</li>
                <li className="flex items-center gap-2 text-sm text-gray-600"><span className="text-green-500">✓</span>{t('pricing.freeFeature3')}</li>
              </ul>
              <Link href={actionHref} className="w-full text-center bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-3 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                {t('pricing.freeBtn')}
              </Link>
            </div>

            {/* Daily */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col">
              <div className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">{t('pricing.daily')}</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold text-gray-900">{t('pricing.dailyPrice')}</span>
                <span className="text-gray-400 text-sm">{t('pricing.dailyPeriod')}</span>
              </div>
              <div className="text-sm text-gray-400 mb-6">{t('pricing.dailyDesc')}</div>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-2 text-sm text-gray-600"><span className="text-green-500">✓</span>{t('pricing.dailyFeature1')}</li>
                <li className="flex items-center gap-2 text-sm text-gray-600"><span className="text-green-500">✓</span>{t('pricing.dailyFeature2')}</li>
                <li className="flex items-center gap-2 text-sm text-gray-600"><span className="text-green-500">✓</span>{t('pricing.dailyFeature3')}</li>
              </ul>
              <Link href={actionHref} className="w-full text-center bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors">
                {t('pricing.dailyBtn')}
              </Link>
            </div>

            {/* Monthly — highlighted */}
            <div className="relative bg-gradient-to-b from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 rounded-2xl border-2 border-blue-500 p-6 flex flex-col shadow-lg">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                {t('pricing.popular')}
              </div>
              <div className="text-sm font-bold text-blue-600 uppercase tracking-wide mb-2">{t('pricing.monthly')}</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold text-gray-900">{t('pricing.monthlyPrice')}</span>
                <span className="text-gray-400 text-sm">{t('pricing.monthlyPeriod')}</span>
              </div>
              <div className="text-sm text-gray-400 mb-6">{t('pricing.monthlyDesc')}</div>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-2 text-sm text-gray-600"><span className="text-green-500">✓</span>{t('pricing.monthlyFeature1')}</li>
                <li className="flex items-center gap-2 text-sm text-gray-600"><span className="text-green-500">✓</span>{t('pricing.monthlyFeature2')}</li>
                <li className="flex items-center gap-2 text-sm text-gray-600"><span className="text-green-500">✓</span>{t('pricing.monthlyFeature3')}</li>
              </ul>
              <Link href={actionHref} className="w-full text-center bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md">
                {t('pricing.monthlyBtn')}
              </Link>
            </div>
          </div>
          <p className="text-center mt-6 text-sm text-green-600 font-medium">🎓 {t('pricing.studentDiscount')}</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white animate-gradient">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="text-5xl mb-6">💰</div>
          <h2 className="text-3xl font-bold mb-4">{t('cta.title')}</h2>
          <p className="text-blue-100 mb-8 text-lg">
            {t('cta.subtitle')}
          </p>
          <Link
            href={actionHref}
            className="inline-block bg-yellow-400 text-blue-900 text-lg font-bold px-10 py-4 rounded-xl hover:bg-yellow-300 transition-all shadow-lg"
          >
            {t('cta.button')}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-gray-400 py-8 text-center text-sm">
        <p>{t('footer')}</p>
      </footer>
    </div>
  )
}

function StepCard({ step, icon, title, description, color }: {
  step: string; icon: string; title: string; description: string; color: string
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-600', green: 'bg-green-600', purple: 'bg-purple-600'
  }
  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-xs font-bold text-gray-300 mb-4 tracking-widest">{step}</div>
      <div className={`w-12 h-12 ${colors[color]} rounded-xl flex items-center justify-center text-2xl mb-4`}>{icon}</div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  )
}

function FeatureBig({ icon, title, description, image, color, href, comingSoonLabel }: {
  icon: string; title: string; description: string; image: string
  color: string; href: string; comingSoonLabel?: string
}) {
  const colors: Record<string, string> = {
    blue: 'from-blue-500 to-blue-700',
    purple: 'from-purple-500 to-purple-700',
    green: 'from-green-500 to-green-700',
    orange: 'from-orange-500 to-orange-700',
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className={`relative h-40 bg-gradient-to-br ${colors[color]} overflow-hidden`}>
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover mix-blend-overlay opacity-40"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl">{icon}</span>
        </div>
        {comingSoonLabel && (
          <div className="absolute top-3 right-3 bg-white/90 text-orange-600 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span>
            {comingSoonLabel}
          </div>
        )}
      </div>
      <div className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
