'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { getSpeakingTopic } from '@/lib/helpers'
import SubscriptionPaywall from '@/components/shared/SubscriptionPaywall'

interface Analytics {
  totalWords: number
  durationSec: number
  wpm: number
  avgConfidence: number
  fillerWords: string[]
  fillerCount: number
  longPauses: Array<{ after: string; duration: number }>
  lowConfidenceWords: Array<{ word: string; confidence: number }>
  utterancePaces?: Array<{ text: string; wpm: number; duration: number }>
  paceVariance?: number
}

interface Feedback {
  score: number
  fluency: string
  pronunciation: string
  intonation?: string
  grammar: string
  vocabulary: string
  fillerAnalysis?: string
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
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [showPaywall, setShowPaywall] = useState(false)

  // Timer
  const [elapsed, setElapsed] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  // Browser SpeechRecognition for live preview
  const isRecordingRef = useRef(false)
  const recognitionRef = useRef<any>(null)
  const [liveTranscript, setLiveTranscript] = useState('')

  const newTopic = () => {
    setTopic(getSpeakingTopic(level))
    setTranscript('')
    setTypedText('')
    setFeedback(null)
    setAnalytics(null)
    setErrorMsg('')
    setLiveTranscript('')
    setElapsed(0)
    setTimerRunning(false)
  }

  useEffect(() => {
    newTopic()
  }, [level])

  // Timer logic
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timerRunning])

  // Pause timer on tab switch
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && !isRecording) {
        setTimerRunning(false)
      } else if (!document.hidden && (transcript || typedText) && !feedback) {
        setTimerRunning(true)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [isRecording, transcript, typedText, feedback])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const startRecording = async () => {
    setErrorMsg('')
    setTranscript('')
    setLiveTranscript('')
    setAnalytics(null)
    chunksRef.current = []

    try {
      // Start actual audio recording via MediaRecorder
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.start(1000) // Collect data every second
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
      setTimerRunning(true)

      // Also start browser SpeechRecognition for live preview (best-effort)
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SR) {
        const recognition = new SR()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'
        recognition.onresult = (event: any) => {
          let text = ''
          for (let i = 0; i < event.results.length; i++) {
            text += event.results[i][0].transcript + ' '
          }
          setLiveTranscript(text.trim())
        }
        recognition.onerror = () => { /* ignore — just preview */ }
        recognition.onend = () => {
          if (isRecordingRef.current) {
            try { recognition.start() } catch { /* ignore */ }
          }
        }
        recognitionRef.current = recognition
        isRecordingRef.current = true
        recognition.start()
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setErrorMsg('Microphone access denied. Allow mic in browser settings, or use text mode.')
      } else {
        setErrorMsg(`Could not start microphone: ${err.message}`)
      }
    }
  }

  const stopRecording = async () => {
    // Stop browser recognition
    isRecordingRef.current = false
    recognitionRef.current?.stop()

    // Stop MediaRecorder and get audio blob
    const mediaRecorder = mediaRecorderRef.current
    if (!mediaRecorder) return

    setIsRecording(false)
    setTranscribing(true)

    // Wait for MediaRecorder to finish
    await new Promise<void>((resolve) => {
      mediaRecorder.onstop = () => resolve()
      mediaRecorder.stop()
    })

    // Stop all tracks
    mediaRecorder.stream.getTracks().forEach(track => track.stop())

    // Send to Deepgram for accurate transcription + analytics
    const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
    const formData = new FormData()
    formData.append('audio', audioBlob)

    try {
      const res = await fetch('/api/speaking/transcribe', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.code === 'SUBSCRIPTION_REQUIRED') { setShowPaywall(true); return }
      if (data.error) throw new Error(data.error)

      setTranscript(data.transcript)
      if (data.analytics) setAnalytics(data.analytics)
    } catch (err: any) {
      // Fallback to live transcript if Deepgram fails
      if (liveTranscript) {
        setTranscript(liveTranscript)
        setErrorMsg('Audio analysis unavailable — using browser transcription as fallback.')
      } else {
        setErrorMsg('Transcription failed. Try text mode instead.')
        setInputMode('text')
      }
    }
    setTranscribing(false)
  }

  const handleAnalyze = async () => {
    const finalText = inputMode === 'voice' ? transcript : typedText.trim()
    if (!finalText) return

    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/speaking/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: finalText, topic, analytics }),
      })
      const data = await res.json()
      if (data.code === 'SUBSCRIPTION_REQUIRED') { setShowPaywall(true); setLoading(false); return }
      if (data.error) throw new Error(data.error)
      setFeedback(data)
      setTimerRunning(false)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to get feedback. Please try again.')
    }
    setLoading(false)
  }

  const hasContent = inputMode === 'voice' ? !!transcript : typedText.trim().length > 10

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

      {/* Timer bar */}
      {(timerRunning || elapsed > 0) && (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>⏱</span>
            <span className="font-mono font-medium text-gray-900">{formatTime(elapsed)}</span>
          </div>
          {isRecording && (
            <span className="text-xs text-red-500 animate-pulse font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 bg-red-500 rounded-full" />
              {t('recording')}
            </span>
          )}
        </div>
      )}

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
        {/* Paywall */}
        {showPaywall && <SubscriptionPaywall />}

        {/* Error banner */}
        {errorMsg && !showPaywall && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
            <span className="mt-0.5">⚠️</span>
            <span className="flex-1">{errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="text-amber-500 hover:text-amber-700 font-bold flex-shrink-0">×</button>
          </div>
        )}

        {inputMode === 'voice' ? (
          <>
            <div className="flex items-center gap-4 mb-6">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  disabled={transcribing}
                  className="flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
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
            </div>

            {/* Live preview while recording */}
            {isRecording && liveTranscript && (
              <div className="mb-4">
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Live Preview</div>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-400 italic leading-relaxed min-h-[3rem]">
                  {liveTranscript}
                </div>
              </div>
            )}

            {/* Transcribing state */}
            {transcribing && (
              <div className="mb-4 flex items-center gap-3 text-sm text-blue-600">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                Analyzing your speech with Deepgram...
              </div>
            )}

            {/* Final transcript */}
            {transcript && !isRecording && (
              <div className="mb-4">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  {t('transcript')}
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed min-h-[5rem]">
                  {transcript}
                </div>
              </div>
            )}

            {/* Speech analytics summary */}
            {analytics && !feedback && (
              <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-blue-700">{analytics.wpm}</div>
                  <div className="text-xs text-blue-600">words/min</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-purple-700">{analytics.avgConfidence}%</div>
                  <div className="text-xs text-purple-600">clarity</div>
                </div>
                <div className={`rounded-lg p-3 text-center ${analytics.fillerCount > 3 ? 'bg-amber-50' : 'bg-green-50'}`}>
                  <div className={`text-lg font-bold ${analytics.fillerCount > 3 ? 'text-amber-700' : 'text-green-700'}`}>{analytics.fillerCount}</div>
                  <div className={`text-xs ${analytics.fillerCount > 3 ? 'text-amber-600' : 'text-green-600'}`}>fillers</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-gray-700">{analytics.durationSec}s</div>
                  <div className="text-xs text-gray-600">duration</div>
                </div>
                {analytics.paceVariance !== undefined && (
                  <div className={`rounded-lg p-3 text-center ${analytics.paceVariance < 10 ? 'bg-amber-50' : analytics.paceVariance <= 30 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className={`text-lg font-bold ${analytics.paceVariance < 10 ? 'text-amber-700' : analytics.paceVariance <= 30 ? 'text-green-700' : 'text-red-700'}`}>{analytics.paceVariance}</div>
                    <div className={`text-xs ${analytics.paceVariance < 10 ? 'text-amber-600' : analytics.paceVariance <= 30 ? 'text-green-600' : 'text-red-600'}`}>rhythm</div>
                  </div>
                )}
              </div>
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
              onChange={(e) => { setTypedText(e.target.value); if (!timerRunning && !feedback) setTimerRunning(true) }}
              placeholder="Type your spoken response here..."
              rows={6}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="text-xs text-gray-400 mt-1">
              {typedText.trim().split(/\s+/).filter(Boolean).length} words
            </div>
          </div>
        )}

        {hasContent && !isRecording && !transcribing && (
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
              {elapsed > 0 && (
                <div className="text-xs text-gray-400 mt-1">⏱ {formatTime(elapsed)}</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FeedbackCard title={t('feedback.fluency')} content={feedback.fluency} color="blue" />
            <FeedbackCard title={t('feedback.pronunciation')} content={feedback.pronunciation} color="purple" />
            {feedback.intonation && (
              <FeedbackCard title={t('feedback.intonation')} content={feedback.intonation} color="teal" />
            )}
            {feedback.fillerAnalysis && (
              <FeedbackCard title={t('feedback.fillerAnalysis')} content={feedback.fillerAnalysis} color="amber" />
            )}
            <FeedbackCard title={t('feedback.grammar')} content={feedback.grammar} color="green" />
            <FeedbackCard title={t('feedback.vocabulary')} content={feedback.vocabulary} color="indigo" />
          </div>

          {/* Analytics detail in feedback */}
          {analytics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-blue-50 rounded-lg p-3 text-center" title="Native speakers average 120-150 wpm">
                <div className="text-lg font-bold text-blue-700">{analytics.wpm}</div>
                <div className="text-xs text-blue-600">words/min</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center" title="Pronunciation confidence from Deepgram AI">
                <div className="text-lg font-bold text-purple-700">{analytics.avgConfidence}%</div>
                <div className="text-xs text-purple-600">clarity</div>
              </div>
              <div className={`rounded-lg p-3 text-center ${analytics.fillerCount > 3 ? 'bg-amber-50' : 'bg-green-50'}`}>
                <div className={`text-lg font-bold ${analytics.fillerCount > 3 ? 'text-amber-700' : 'text-green-700'}`}>{analytics.fillerCount}</div>
                <div className={`text-xs ${analytics.fillerCount > 3 ? 'text-amber-600' : 'text-green-600'}`}>fillers</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-gray-700">{analytics.totalWords}</div>
                <div className="text-xs text-gray-600">total words</div>
              </div>
              {analytics.paceVariance !== undefined && (
                <div className={`rounded-lg p-3 text-center ${analytics.paceVariance < 10 ? 'bg-amber-50' : analytics.paceVariance <= 30 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className={`text-lg font-bold ${analytics.paceVariance < 10 ? 'text-amber-700' : analytics.paceVariance <= 30 ? 'text-green-700' : 'text-red-700'}`}>{analytics.paceVariance}</div>
                  <div className={`text-xs ${analytics.paceVariance < 10 ? 'text-amber-600' : analytics.paceVariance <= 30 ? 'text-green-600' : 'text-red-600'}`}>rhythm</div>
                </div>
              )}
            </div>
          )}

          {analytics && analytics.lowConfidenceWords.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="text-sm font-semibold text-amber-800 mb-2">Words to practice (low clarity)</div>
              <div className="flex flex-wrap gap-2">
                {analytics.lowConfidenceWords.map((w, i) => (
                  <span key={i} className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded">
                    {w.word} ({w.confidence}%)
                  </span>
                ))}
              </div>
            </div>
          )}

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

function FeedbackCard({ title, content, color = 'blue' }: { title: string; content: string; color?: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100 text-blue-600',
    purple: 'bg-purple-50 border-purple-100 text-purple-600',
    green: 'bg-green-50 border-green-100 text-green-600',
    amber: 'bg-amber-50 border-amber-100 text-amber-600',
    teal: 'bg-teal-50 border-teal-100 text-teal-600',
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-600',
  }
  const c = colors[color] || colors.blue
  return (
    <div className={`border rounded-lg p-3 ${c.split(' ').slice(0, 2).join(' ')}`}>
      <div className={`text-xs font-semibold uppercase tracking-wide mb-1 ${c.split(' ')[2]}`}>{title}</div>
      <p className="text-sm text-gray-700 leading-relaxed">{content}</p>
    </div>
  )
}
