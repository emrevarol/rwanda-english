import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // Send audio to Deepgram
    const arrayBuffer = await audio.arrayBuffer()
    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=en&smart_format=true', {
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
    const transcript = result.results?.channels?.[0]?.alternatives?.[0]?.transcript || ''

    return NextResponse.json({ transcript })
  } catch (error) {
    console.error('Transcribe error:', error)
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
  }
}
