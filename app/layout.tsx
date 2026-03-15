import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'english.cash — Better English = More Cash',
    template: '%s | english.cash',
  },
  description: 'AI-powered English learning platform. Master English in 365 days with personalized daily lessons. Writing, speaking, listening, grammar & vocabulary — all with AI feedback.',
  metadataBase: new URL('https://english.cash'),
  alternates: {
    canonical: '/',
    languages: {
      en: '/en',
      tr: '/tr',
      de: '/de',
      es: '/es',
      fr: '/fr',
      ar: '/ar',
      pt: '/pt',
      zh: '/zh',
      ja: '/ja',
      ko: '/ko',
    },
  },
  openGraph: {
    type: 'website',
    siteName: 'english.cash',
    title: 'english.cash — Better English = More Cash',
    description: 'AI-powered English learning. Master writing, speaking, listening, grammar & vocabulary in 365 days.',
    url: 'https://english.cash',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'english.cash — Better English = More Cash',
    description: 'AI-powered English learning. 365-day personalized program with daily AI feedback.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
  keywords: ['English learning', 'AI English tutor', 'learn English online', 'English writing practice', 'English speaking practice', 'CEFR', 'business English', 'english.cash'],
  authors: [{ name: 'Emre Varol' }],
  creator: 'english.cash',
  publisher: 'english.cash',
  category: 'Education',
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: 'english.cash',
      url: 'https://english.cash',
      description: 'AI-powered English learning platform',
      inLanguage: ['en', 'tr', 'de', 'es', 'fr', 'ar', 'pt', 'zh', 'ja', 'ko'],
    },
    {
      '@type': 'Organization',
      name: 'english.cash',
      url: 'https://english.cash',
      founder: { '@type': 'Person', name: 'Emre Varol' },
    },
    {
      '@type': 'Course',
      name: '365-Day English Mastery Program',
      description: 'AI-powered personalized English learning path covering writing, speaking, listening, grammar, and vocabulary.',
      provider: { '@type': 'Organization', name: 'english.cash' },
      educationalLevel: 'Beginner to Advanced (CEFR A1-C2)',
      inLanguage: 'en',
      offers: [
        { '@type': 'Offer', price: '0', priceCurrency: 'USD', name: 'Free Trial', description: '3 days full access' },
        { '@type': 'Offer', price: '0.99', priceCurrency: 'USD', name: 'Daily', description: 'Pay as you go' },
        { '@type': 'Offer', price: '19.99', priceCurrency: 'USD', name: 'Monthly', description: 'Unlimited access' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How does english.cash work?',
          acceptedAnswer: { '@type': 'Answer', text: 'english.cash uses AI to provide personalized English lessons. Take a placement test, follow your 365-day daily plan (2 sessions x 15 min), and get instant AI feedback on writing, speaking, listening, grammar, and vocabulary.' },
        },
        {
          '@type': 'Question',
          name: 'Is english.cash free?',
          acceptedAnswer: { '@type': 'Answer', text: 'Yes! You get 3 days of full free access. After that, you can pay $0.99/day or $19.99/month for unlimited AI feedback and all features.' },
        },
        {
          '@type': 'Question',
          name: 'What English levels does english.cash support?',
          acceptedAnswer: { '@type': 'Answer', text: 'english.cash supports all CEFR levels from A1 (beginner) to C2 (proficiency). An AI placement test determines your level, and content adapts automatically.' },
        },
      ],
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-Y2P1TWVCJ7"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-Y2P1TWVCJ7');
          `}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
