'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Navigation from '@/components/shared/Navigation'
import Avatar from '@/components/shared/Avatar'

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const t = useTranslations('profile')
  const tc = useTranslations('common')
  const fileRef = useRef<HTMLInputElement>(null)

  const [avatar, setAvatar] = useState<string | null>(null)
  const [bio, setBio] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/profile')
        .then(r => r.json())
        .then(d => {
          setAvatar(d.avatar || null)
          setBio(d.bio || '')
        })
    }
  }, [status])

  const uploadToCloudinary = async (file: File) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
    if (!cloudName || !uploadPreset) {
      alert('Cloudinary not configured')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', uploadPreset)

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.error) {
        alert(`Upload error: ${data.error.message}`)
        return
      }
      if (data.secure_url) {
        setAvatar(data.secure_url)
        await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar: data.secure_url }),
        })
        await update()
      }
    } catch (err: any) {
      console.error('Upload failed:', err)
      alert(`Upload failed: ${err?.message || 'Unknown error'}`)
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Max 5MB')
        return
      }
      uploadToCloudinary(file)
    }
  }

  const removeAvatar = async () => {
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar: '' }),
    })
    setAvatar(null)
    await update()
  }

  const saveBio = async () => {
    setSaving(true)
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio }),
    })
    await update()
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">{tc('loginRequired')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navigation />
      <div className="max-w-lg mx-auto px-4 py-10 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>

        {/* Avatar */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar
                src={avatar}
                name={session?.user?.name || '?'}
                size={120}
              />
              {uploading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {uploading ? t('uploading') : avatar ? t('changePhoto') : t('uploadPhoto')}
              </button>
              {avatar && (
                <button
                  onClick={removeAvatar}
                  className="text-sm text-gray-500 hover:text-red-500 px-3 py-2 transition-colors"
                >
                  {t('removePhoto')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('bio')}
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={160}
            rows={3}
            placeholder={t('bioPlaceholder')}
            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">{bio.length}/160</span>
            <button
              onClick={saveBio}
              disabled={saving}
              className={`text-sm px-4 py-2 rounded-lg font-medium transition-all ${
                saved
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } disabled:opacity-50`}
            >
              {saved ? t('saved') : saving ? '...' : t('save')}
            </button>
          </div>
        </div>

        {/* User info (read-only) */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t('name')}</span>
            <span className="font-medium text-gray-900 dark:text-white">{session?.user?.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t('email')}</span>
            <span className="font-medium text-gray-900 dark:text-white">{session?.user?.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t('level')}</span>
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {session?.user?.level}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
