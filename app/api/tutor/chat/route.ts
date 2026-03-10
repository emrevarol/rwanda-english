import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { anthropic, MODEL, getCEFRSystemPrompt } from '@/lib/claude'
import { prisma } from '@/lib/db'
import { isMockMode, mockTutorResponse } from '@/lib/mock'
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

    const { messages, sessionId } = await req.json()
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 })
    }

    // Ensure we have a valid session
    let chatSessionId = sessionId
    if (!chatSessionId) {
      const chatSession = await prisma.chatSession.create({
        data: { userId: session.user.id, title: 'New Chat' },
      })
      chatSessionId = chatSession.id
    }

    const lastMessage = messages[messages.length - 1]

    await prisma.chatMessage.create({
      data: { userId: session.user.id, sessionId: chatSessionId, role: 'user', content: lastMessage.content },
    })

    // Auto-title: use first user message as title (truncated)
    const messageCount = await prisma.chatMessage.count({ where: { sessionId: chatSessionId, role: 'user' } })
    if (messageCount === 1) {
      const title = lastMessage.content.slice(0, 60) + (lastMessage.content.length > 60 ? '...' : '')
      await prisma.chatSession.update({ where: { id: chatSessionId }, data: { title } })
    }

    // Update session timestamp
    await prisma.chatSession.update({ where: { id: chatSessionId }, data: { updatedAt: new Date() } })

    // Mock mode: stream a fake response word by word
    if (isMockMode()) {
      const mockText = mockTutorResponse(lastMessage.content)
      const encoder = new TextEncoder()
      const readable = new ReadableStream({
        async start(controller) {
          const words = mockText.split(' ')
          for (const word of words) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: word + ' ', sessionId: chatSessionId })}\n\n`))
            await new Promise((r) => setTimeout(r, 30))
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
          await prisma.chatMessage.create({
            data: { userId: session.user.id, sessionId: chatSessionId, role: 'assistant', content: mockText },
          })
        },
      })
      return new Response(readable, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
      })
    }

    // Real Claude streaming
    const systemPrompt =
      getCEFRSystemPrompt(session.user.level, session.user.language) +
      `\n\nStudent name: ${session.user.name}. Address them by name occasionally.`

    const stream = await anthropic.messages.stream({
      model: MODEL,
      max_tokens: 1000,
      system: systemPrompt,
      messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        let fullResponse = ''
        try {
          // Send sessionId first
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ sessionId: chatSessionId })}\n\n`))
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              const text = chunk.delta.text
              fullResponse += text
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          await prisma.chatMessage.create({
            data: { userId: session.user.id, sessionId: chatSessionId, role: 'assistant', content: fullResponse },
          })
        } catch (err) {
          controller.error(err)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
    })
  } catch (error) {
    console.error('Tutor chat error:', error)
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 })
  }
}
