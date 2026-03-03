'use client'

import { useTranslations } from 'next-intl'
import { useSession, signOut } from 'next-auth/react'
import { Link, usePathname } from '@/i18n/navigation'
import LanguageSwitcher from './LanguageSwitcher'

export default function Navigation() {
  const t = useTranslations('nav')
  const { data: session } = useSession()
  const pathname = usePathname()

  const navLinks = session
    ? [
        { href: '/learning-path', label: '🗓 Daily Plan' },
        { href: '/dashboard', label: t('dashboard') },
        { href: '/writing', label: t('writing') },
        { href: '/listening', label: t('listening') },
        { href: '/tutor', label: t('tutor') },
      ]
    : []

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">RE</span>
            </div>
            <span className="font-bold text-gray-900 hidden sm:block">Rwanda English</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {session ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 hidden sm:block">
                  {session.user.name}
                </span>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                  {session.user.level}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: '/en' })}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  {t('logout')}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  {t('login')}
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
        <div className="md:hidden border-t border-gray-100">
          <div className="flex overflow-x-auto gap-1 px-4 py-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
