'use client'

interface AvatarProps {
  src?: string | null
  name: string
  size?: number
  className?: string
}

export default function Avatar({ src, name, size = 40, className = '' }: AvatarProps) {
  const initials = name.charAt(0).toUpperCase()
  const fontSize = size < 32 ? 'text-xs' : size < 48 ? 'text-sm' : 'text-lg'

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      className={`bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold ${fontSize} ${className}`}
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  )
}
