import type { MetadataRoute } from 'next'

const DOMAIN = 'https://english.cash'
const LOCALES = ['en', 'rw', 'tr', 'zh', 'es', 'pt', 'ja', 'ko', 'id', 'ar', 'hi', 'vi', 'th', 'de', 'fr', 'it', 'ru', 'pl']

const PAGES = [
  { path: '', priority: 1.0, changeFrequency: 'weekly' as const },
  { path: '/pricing', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/login', priority: 0.5, changeFrequency: 'yearly' as const },
  { path: '/register', priority: 0.7, changeFrequency: 'yearly' as const },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  for (const page of PAGES) {
    for (const locale of LOCALES) {
      const url = `${DOMAIN}/${locale}${page.path}`
      entries.push({
        url,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: {
          languages: Object.fromEntries(
            LOCALES.map(l => [l, `${DOMAIN}/${l}${page.path}`])
          ),
        },
      })
    }
  }

  return entries
}
