'use client'

import { useTranslations } from 'next-intl'
import { useSession, signOut } from 'next-auth/react'
import { Link, usePathname } from '@/i18n/navigation'
import LanguageSwitcher from './LanguageSwitcher'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'
import Avatar from './Avatar'
import NotificationBell from './NotificationBell'

export default function Navigation() {
  const t = useTranslations('nav')
  const { data: session } = useSession()
  const pathname = usePathname()

  const navLinks = session
    ? [
        { href: '/learning-path', label: t('dailyPlan'), color: '' },
        { href: '/dashboard', label: t('dashboard'), color: '' },
        { href: '/writing', label: t('writing'), color: '#0284c7' },
        { href: '/listening', label: t('listening'), color: '#9333ea' },
        { href: '/speaking', label: t('speaking'), color: '#16a34a' },
        { href: '/vocabulary', label: t('vocabulary'), color: '#f59e0b' },
        { href: '/grammar', label: t('grammar'), color: '#d4798a' },
        { href: '/tutor', label: t('tutor'), color: '' },
        { href: '/leaderboard', label: t('leaderboard'), color: '' },
        { href: '/friends', label: t('friends'), color: '' },
      ]
    : []

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Logo size={34} />
            <span className="font-bold text-gray-900 dark:text-white hidden sm:block text-lg tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              english.cash
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  pathname === link.href
                    ? 'bg-blue-50 dark:bg-blue-900/50 shadow-sm'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                style={link.color ? {
                  color: pathname === link.href ? link.color : undefined,
                } : undefined}
              >
                {link.color ? (
                  <span style={{ color: link.color }}>{link.label}</span>
                ) : (
                  <span className={pathname === link.href ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300'}>{link.label}</span>
                )}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
            {session && <NotificationBell />}
            {session ? (
              <div className="flex items-center gap-2">
                <Link href="/profile" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                  <Avatar src={session.user.avatar} name={session.user.name} size={32} />
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full leading-none flex-shrink-0">
                    {session.user.level}
                  </span>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/en' })}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  {t('logout')}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {t('login')}
                </Link>
                <Link
                  href="/register"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm"
                >
                  {t('register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {session && navLinks.length > 0 && (
        <div className="md:hidden border-t border-gray-100 dark:border-gray-700">
          <div className="flex overflow-x-auto gap-1 px-4 py-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  pathname === link.href
                    ? 'bg-blue-50 dark:bg-blue-900/50'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {link.color ? (
                  <span style={{ color: link.color }}>{link.label}</span>
                ) : (
                  <span className={pathname === link.href ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300'}>{link.label}</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
