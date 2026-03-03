'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'

const languages = [
  { code: 'en', label: 'EN', full: 'English' },
  { code: 'rw', label: 'KIN', full: 'Kinyarwanda' },
  { code: 'tr', label: 'TR', full: 'Türkçe' },
]

export default function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const handleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale })
  }

  return (
    <div className="flex items-center gap-1">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleChange(lang.code)}
          className={`text-xs px-2 py-1 rounded transition-colors ${
            locale === lang.code
              ? 'bg-blue-600 text-white'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
          title={lang.full}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}
