'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Navigation from '@/components/shared/Navigation'
import { getSpeakingTopic } from '@/lib/helpers'

interface Feedback {
  score: number
  fluency: string
  grammar: string
  vocabulary: string
  modelAnswer: string
  overallFeedback: string
}

export default function SpeakingPage() {
  const t = useTranslations('speaking')
  const tc = useTranslations('common')
  const { data: session, status } = useSession()

  const [topic, setTopic] = useState('')
  const [mode, setMode] = useState<'text' | 'voice'>('text')
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [voiceTested, setVoiceTested] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const recognitionRef = useRef<any>(null)

  // Check if SpeechRecognition API exists
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SR) setVoiceSupported(true)
  }, [])

  useEffect(() => {
    if (session?.user?.level) {
      setTopic(getSpeakingTopic(session.user.level))
    }
  }, [session?.user?.level])

  const newTopic = () => {
    setTopic(getSpeakingTopic(session?.user?.level || 'B1'))
    setTranscript('')
    setFeedback(null)
    setError('')
  }

  const startRecording = () => {
    setError('')
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError(t('noSupport'))
      setMode('text')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    let finalTranscript = transcript

    recognition.onresult = (event: any) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' '
        } else {
          interim += event.results[i][0].transcript
        }
      }
      setTranscript(finalTranscript + interim)
    }

    recognition.onerror = (event: any) => {
      setIsRecording(false)
      if (event.error === 'network' || event.error === 'audio-capture' || event.error === 'service-not-allowed') {
        setVoiceSupported(false)
        setVoiceTested(true)
        setMode('text')
      } else if (event.error === 'not-allowed') {
        setError(t('errorNotAllowed'))
      } else {
        setError(t('errorGeneric', { error: event.error }))
      }
    }

    recognition.onstart = () => {
      setVoiceTested(true)
    }

    recognition.onend = () => {
      setIsRecording(false)
      setTranscript(finalTranscript)
    }

    try {
      recognition.start()
      recognitionRef.current = recognition
      setIsRecording(true)
    } catch (err: any) {
      setError(t('errorMicStart', { error: err.message }))
    }
  }

  const stopRecording = () => {
    recognitionRef.current?.stop()
    setIsRecording(false)
  }

  const submitForFeedback = async () => {
    if (!transcript.trim() || transcript.trim().split(/\s+/).length < 3) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/speaking/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, topic }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || 'Failed to get feedback')
      } else {
        setFeedback(data)
      }
    } catch {
      setError(t('errorNetwork'))
    }
    setLoading(false)
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">{t('loginMessage')}</p>
      </div>
    )
  }

  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0

  const scoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 5) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {t('level') || tc('level')}: <span className="font-medium text-blue-600">{session?.user?.level}</span>
            </p>
          </div>
        </div>

        {/* Topic */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">{t('topic')}</div>
              <p className="text-gray-800 text-sm leading-relaxed">{topic}</p>
            </div>
            <button
              onClick={newTopic}
              className="flex-shrink-0 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('newTopic')}
            </button>
          </div>
        </div>

        {/* Mode selector — show voice option only if API exists and hasn't failed */}
        {voiceSupported && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMode('text')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                mode === 'text' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              ⌨️ {t('textMode')}
            </button>
            <button
              onClick={() => setMode('voice')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                mode === 'voice' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              🎙️ {t('voiceMode')}
            </button>
          </div>
        )}

        {/* Input area */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          {mode === 'voice' && voiceSupported ? (
            <div className="text-center space-y-4">
              {/* Record button */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={loading}
                className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl mx-auto transition-all ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                }`}
              >
                {isRecording ? '⏹' : '🎙️'}
              </button>
              <p className="text-sm text-gray-500">
                {isRecording ? t('recording') : t('record')}
              </p>
              {/* Show transcript */}
              {transcript && (
                <div className="text-left bg-gray-50 rounded-lg p-4 mt-4">
                  <div className="text-xs font-medium text-gray-400 mb-1">{t('transcript')}</div>
                  <p className="text-sm text-gray-800 leading-relaxed">{transcript}</p>
                  <div className="text-xs text-gray-400 mt-2">{wordCount} {t('words')}</div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">💬</span>
                <p className="text-sm text-gray-500">{t('textModeDesc')}</p>
              </div>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={t('textPlaceholder')}
                rows={6}
                className="w-full text-sm text-gray-800 focus:outline-none resize-none leading-relaxed border border-gray-200 rounded-lg p-3"
              />
              <div className="text-xs text-gray-400 mt-1">{wordCount} {t('words')}</div>
            </div>
          )}

          {/* Submit button */}
          {transcript.trim() && !feedback && (
            <button
              onClick={submitForFeedback}
              disabled={loading || wordCount < 3}
              className="w-full mt-4 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? t('analyzing') : t('getAIFeedback')}
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center gap-2 mb-4">
            <span>⚠️</span> {error}
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600 font-bold">×</button>
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{t('feedback.title')}</h3>
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-0.5">{t('feedback.score')}</div>
                <div className={`text-3xl font-bold ${scoreColor(feedback.score)}`}>
                  {feedback.score}<span className="text-lg text-gray-300">/10</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">{t('feedback.fluency')}</div>
                <p className="text-sm text-gray-700 leading-relaxed">{feedback.fluency}</p>
              </div>
              <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                <div className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">{t('feedback.grammar')}</div>
                <p className="text-sm text-gray-700 leading-relaxed">{feedback.grammar}</p>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                <div className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">{t('feedback.vocabulary')}</div>
                <p className="text-sm text-gray-700 leading-relaxed">{feedback.vocabulary}</p>
              </div>
            </div>

            {feedback.modelAnswer && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="text-sm font-semibold text-amber-800 mb-1">{t('feedback.model')}</div>
                <p className="text-sm text-amber-700 leading-relaxed italic">"{feedback.modelAnswer}"</p>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-semibold text-gray-700 mb-1">{t('feedback.overall')}</div>
              <p className="text-sm text-gray-600 leading-relaxed">{feedback.overallFeedback}</p>
            </div>

            <button
              onClick={newTopic}
              className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              {t('newTopic')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
