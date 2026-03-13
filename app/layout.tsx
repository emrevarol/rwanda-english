import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: 'english.cash — Better English = More Cash',
  description: 'AI-powered English learning platform. Master English in 365 days with personalized daily lessons.',
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
      </head>
      <body>{children}</body>
    </html>
  )
}
