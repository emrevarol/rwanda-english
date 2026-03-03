'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { getSpeakingTopic } from '@/lib/helpers'

interface Feedback {
  score: number
  fluency: string
  grammar: string
  vocabulary: string
  modelAnswer: string
  overallFeedback: string
}

type InputMode = 'voice' | 'text'

export default function SpeakingRecorder({ level }: { level: string }) {
  const t = useTranslations('speaking')
  const [topic, setTopic] = useState('')
  const [inputMode, setInputMode] = useState<InputMode>('voice')
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [typedText, setTypedText] = useState('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [loading, setLoading] = useState(false)
  const [supported, setSupported] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const isRecordingRef = useRef(false)
  const recognitionRef = useRef<any>(null)

  const newTopic = () => {
    setTopic(getSpeakingTopic(level))
    setTranscript('')
    setTypedText('')
    setFeedback(null)
    setErrorMsg('')
  }

  useEffect(() => {
    newTopic()
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      setSupported(false)
      setInputMode('text')
    }
  }, [level])

  const startRecording = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return

    setErrorMsg('')
    setTranscript('')

    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript
        if (event.results[i].isFinal) final += text + ' '
        else interim += text
      }
      setTranscript((prev) => {
        const base = prev.replace(/\[interim\].*$/, '')
        return base + final + (interim ? `[interim]${interim}` : '')
      })
    }

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') return

      isRecordingRef.current = false
      setIsRecording(false)
      recognitionRef.current?.abort()

      if (event.error === 'network') {
        // Switch to text mode automatically
        setInputMode('text')
        setErrorMsg('Voice recognition requires Google servers (network). Switched to text input mode — type your response below.')
      } else if (event.error === 'not-allowed') {
        setErrorMsg('Microphone access denied. Allow mic in browser settings, or switch to text mode.')
      } else if (event.error === 'audio-capture') {
        setErrorMsg('No microphone detected. Switch to text mode.')
      } else {
        setErrorMsg(`Speech error: ${event.error}. Try text mode instead.`)
      }
    }

    recognition.onend = () => {
      if (isRecordingRef.current) {
        try { recognition.start() } catch { /* ignore */ }
      }
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
      isRecordingRef.current = true
      setIsRecording(true)
    } catch (err: any) {
      setErrorMsg('Could not start microphone: ' + err.message)
    }
  }

  const stopRecording = () => {
    isRecordingRef.current = false
    setIsRecording(false)
    recognitionRef.current?.stop()
    setTranscript((prev) => prev.replace(/\[interim\].*$/, '').trim())
  }

  const handleAnalyze = async () => {
    const finalText = inputMode === 'voice'
      ? transcript.replace(/\[interim\].*$/, '').trim()
      : typedText.trim()

    if (!finalText) return

    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/speaking/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: finalText, topic }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setFeedback(data)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to get feedback. Please try again.')
    }
    setLoading(false)
  }

  const displayTranscript = transcript.replace(/\[interim\](.*)$/, (_, interim) =>
    `<span class="text-gray-400 italic">${interim}</span>`
  )
  const cleanTranscript = transcript.replace(/\[interim\].*$/, '').trim()
  const hasContent = inputMode === 'voice' ? !!cleanTranscript : typedText.trim().length > 10

  return (
    <div className="space-y-4">
      {/* Topic */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">
              {t('topic')}
            </div>
            <p className="text-gray-800 font-medium">{topic}</p>
          </div>
          <button
            onClick={newTopic}
            className="flex-shrink-0 text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {t('newTopic')}
          </button>
        </div>
      </div>

      {/* Mode switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => { setInputMode('voice'); setErrorMsg('') }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
            inputMode === 'voice'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 text-gray-500 hover:bg-gray-50'
          }`}
        >
          🎙️ Voice
        </button>
        <button
          onClick={() => { setInputMode('text'); setErrorMsg('') }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
            inputMode === 'text'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 text-gray-500 hover:bg-gray-50'
          }`}
        >
          ⌨️ Text Input
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* Error banner */}
        {errorMsg && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
            <span className="mt-0.5">⚠️</span>
            <span className="flex-1">{errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="text-amber-500 hover:text-amber-700 font-bold flex-shrink-0">×</button>
          </div>
        )}

        {inputMode === 'voice' ? (
          <>
            {!supported ? (
              <p className="text-sm text-yellow-700">{t('noSupport')}</p>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-6">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-600 transition-colors"
                    >
                      <span className="w-3 h-3 bg-white rounded-full" />
                      {t('record')}
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-900 transition-colors"
                    >
                      <span className="w-3 h-3 bg-red-500 rounded-sm animate-pulse" />
                      {t('stop')}
                    </button>
                  )}
                  {isRecording && (
                    <span className="text-sm text-red-500 animate-pulse font-medium">
                      {t('recording')}
                    </span>
                  )}
                </div>

                {transcript && (
                  <div className="mb-4">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      {t('transcript')}
                    </div>
                    <div
                      className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed min-h-[5rem]"
                      dangerouslySetInnerHTML={{ __html: displayTranscript }}
                    />
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          /* Text input mode */
          <div>
            <p className="text-sm text-gray-500 mb-3">
              Speak out loud, then type what you said (or just type your response directly):
            </p>
            <textarea
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              placeholder="Type your spoken response here..."
              rows={6}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="text-xs text-gray-400 mt-1">
              {typedText.trim().split(/\s+/).filter(Boolean).length} words
            </div>
          </div>
        )}

        {hasContent && !isRecording && (
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? t('analyzing') : 'Get AI Feedback'}
          </button>
        )}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{t('feedback.title')}</h3>
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-0.5">{t('feedback.score')}</div>
              <div className={`text-3xl font-bold ${
                feedback.score >= 7 ? 'text-green-600' : feedback.score >= 5 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {feedback.score}/10
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FeedbackCard title={t('feedback.fluency')} content={feedback.fluency} />
            <FeedbackCard title={t('feedback.grammar')} content={feedback.grammar} />
            <FeedbackCard title={t('feedback.vocabulary')} content={feedback.vocabulary} />
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm font-semibold text-green-800 mb-2">💬 {t('feedback.model')}</div>
            <p className="text-sm text-green-700 italic">{feedback.modelAnswer}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-semibold text-gray-700 mb-1">{t('feedback.overall')}</div>
            <p className="text-sm text-gray-600">{feedback.overallFeedback}</p>
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
  )
}

function FeedbackCard({ title, content }: { title: string; content: string }) {
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
      <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">{title}</div>
      <p className="text-sm text-gray-700 leading-relaxed">{content}</p>
    </div>
  )
}
