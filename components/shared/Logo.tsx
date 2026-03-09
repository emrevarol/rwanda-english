'use client'

export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Gradient background circle */}
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill="url(#logoGrad)" />
      {/* Book/pages icon */}
      <path d="M12 12C12 12 16 10 20 12C24 10 28 12 28 12V28C28 28 24 26 20 28C16 26 12 28 12 28V12Z" fill="white" fillOpacity="0.9" />
      <line x1="20" y1="12" x2="20" y2="28" stroke="url(#logoGrad)" strokeWidth="1.5" />
      {/* Spark / AI star */}
      <circle cx="30" cy="10" r="4" fill="url(#sparkGrad)" />
      <path d="M30 7L30.7 9.3L33 10L30.7 10.7L30 13L29.3 10.7L27 10L29.3 9.3Z" fill="white" />
    </svg>
  )
}
