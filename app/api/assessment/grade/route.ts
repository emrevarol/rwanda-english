import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { gradeAssessment } from '@/lib/claude'
import { prisma } from '@/lib/db'
import { isMockMode, mockAssessmentResult } from '@/lib/mock'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { answers } = await req.json()

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Invalid answers' }, { status: 400 })
    }

    const result = isMockMode()
      ? mockAssessmentResult
      : await gradeAssessment(answers, session.user.level, session.user.language)

    await prisma.user.update({
      where: { id: session.user.id },
      data: { level: result.level },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Assessment grade error:', error)
    return NextResponse.json({ error: 'Failed to grade assessment' }, { status: 500 })
  }
}
