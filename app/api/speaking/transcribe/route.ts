import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasActiveAccess } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await hasActiveAccess(session.user.id))) {
      return NextResponse.json({ error: 'Subscription required', code: 'SUBSCRIPTION_REQUIRED' }, { status: 403 })
    }

    const formData = await req.formData()
    const audio = formData.get('audio') as Blob | null

    if (!audio) {
      return NextResponse.json({ error: 'No audio file' }, { status: 400 })
    }

    const apiKey = process.env.DEEPGRAM_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Transcription service not configured' }, { status: 500 })
    }

    // Send audio to Deepgram with rich analysis features
    const arrayBuffer = await audio.arrayBuffer()
    const params = new URLSearchParams({
      model: 'nova-2',
      language: 'en',
      smart_format: 'true',
      filler_words: 'true',      // Detect "um", "uh", "like", "you know"
      utterances: 'true',        // Segment by speaker pauses
      paragraphs: 'true',        // Detect paragraph breaks
      punctuate: 'true',         // Add punctuation
      diarize: 'false',          // Single speaker
    })

    const response = await fetch(`https://api.deepgram.com/v1/listen?${params}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': audio.type || 'audio/webm',
      },
      body: arrayBuffer,
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Deepgram error:', err)
      return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
    }

    const result = await response.json()
    const alt = result.results?.channels?.[0]?.alternatives?.[0]
    const transcript = alt?.transcript || ''
    const words = alt?.words || []

    // Extract speech analytics
    const totalWords = words.length
    const FILLER_SET = new Set(['um', 'uh', 'uh-huh', 'uhh', 'hmm', 'hmm-hmm', 'like', 'you know', 'so', 'actually', 'basically', 'literally', 'well', 'right', 'i mean', 'kind of', 'sort of', 'okay', 'anyway', 'honestly'])
    const fillerWords = words.filter((w: any) => FILLER_SET.has(w.word?.toLowerCase()))
    const avgConfidence = totalWords > 0
      ? words.reduce((sum: number, w: any) => sum + (w.confidence || 0), 0) / totalWords
      : 0

    // Words per minute calculation
    const firstWord = words[0]
    const lastWord = words[words.length - 1]
    const durationSec = firstWord && lastWord ? (lastWord.end - firstWord.start) : 0
    const wpm = durationSec > 0 ? Math.round((totalWords / durationSec) * 60) : 0

    // Pause analysis (gaps > 1.5s between words)
    const longPauses: Array<{ after: string; duration: number }> = []
    for (let i = 1; i < words.length; i++) {
      const gap = words[i].start - words[i - 1].end
      if (gap > 1.5) {
        longPauses.push({ after: words[i - 1].word, duration: Math.round(gap * 10) / 10 })
      }
    }

    // Low confidence words (potential pronunciation issues)
    const lowConfidenceWords = words
      .filter((w: any) => w.confidence < 0.7 && w.word?.length > 2)
      .map((w: any) => ({ word: w.word, confidence: Math.round(w.confidence * 100) }))

    // Utterance-level pace analysis (speaking rhythm / intonation proxy)
    const utterances = result.results?.utterances || []
    const utterancePaces: Array<{ text: string; wpm: number; duration: number }> = []
    for (const utt of utterances) {
      const uttDuration = (utt.end || 0) - (utt.start || 0)
      const uttWordCount = (utt.transcript || '').split(/\s+/).filter(Boolean).length
      if (uttDuration > 0) {
        utterancePaces.push({
          text: utt.transcript?.slice(0, 60) || '',
          wpm: Math.round((uttWordCount / uttDuration) * 60),
          duration: Math.round(uttDuration * 10) / 10,
        })
      }
    }

    // Pace variance (monotone vs dynamic delivery)
    const paceValues = utterancePaces.map(u => u.wpm)
    const avgPace = paceValues.length > 0 ? paceValues.reduce((a, b) => a + b, 0) / paceValues.length : 0
    const paceVariance = paceValues.length > 1
      ? Math.round(Math.sqrt(paceValues.reduce((sum, v) => sum + (v - avgPace) ** 2, 0) / paceValues.length))
      : 0

    return NextResponse.json({
      transcript,
      analytics: {
        totalWords,
        durationSec: Math.round(durationSec),
        wpm,
        avgConfidence: Math.round(avgConfidence * 100),
        fillerWords: fillerWords.map((w: any) => w.word),
        fillerCount: fillerWords.length,
        longPauses,
        lowConfidenceWords: lowConfidenceWords.slice(0, 10),
        utterancePaces: utterancePaces.slice(0, 10),
        paceVariance,
      },
    })
  } catch (error) {
    console.error('Transcribe error:', error)
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
  }
}
