'use client'

import { useSession } from 'next-auth/react'
import { Link } from '@/i18n/navigation'

export default function AuthCTA({ label, className }: { label: string; className?: string }) {
  const { data: session } = useSession()
  return (
    <Link href={session ? '/dashboard' : '/register'} className={className}>
      {label}
    </Link>
  )
}
