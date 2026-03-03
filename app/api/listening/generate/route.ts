import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateListeningContent } from '@/lib/claude'
import { isMockMode, mockListeningContent } from '@/lib/mock'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const content = isMockMode()
      ? mockListeningContent
      : await generateListeningContent(session.user.level, session.user.language)

    return NextResponse.json(content)
  } catch (error) {
    console.error('Listening generate error:', error)
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 })
  }
}
