import type { Metadata } from 'next'
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
      <body>{children}</body>
    </html>
  )
}
