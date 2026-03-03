'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  "Explain the difference between 'since' and 'for'",
  "How do I use passive voice correctly?",
  "Give me 5 advanced vocabulary words for academic writing",
  "What's the difference between B1 and B2 English level?",
  "Can you correct this: 'Yesterday I go to school'",
  "How do I improve my essay coherence?",
  "What are good connective phrases for essays?",
  "Explain the present perfect tense with examples",
]

function renderMarkdown(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">$1</code>')
    .replace(/^### (.+)$/gm, '<h3 class="font-bold text-gray-800 mt-2 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-bold text-gray-800 mt-3 mb-1 text-base">$1</h2>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
    .replace(/\n\n/g, '</p><p class="mb-1">')
    .replace(/\n/g, '<br/>')
}

export default function ChatInterface({ userName, userLevel }: { userName: string; userLevel: string }) {
  const t = useTranslations('tutor')
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello **${userName}**! 👋 I'm your AI English tutor.\n\nI can see you're at **${userLevel} level** — I'll adapt everything to your level.\n\nWhat would you like to work on today? You can ask me about grammar, vocabulary, writing tips, or anything English-related!`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    setError('')

    const userMsg: Message = { role: 'user', content: text }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')

    const placeholder: Message = { role: 'assistant', content: '' }
    setMessages([...history, placeholder])
    setLoading(true)

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to get response')
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const lines = decoder.decode(value).split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') continue
          try {
            full += JSON.parse(data).text
            setMessages(prev => {
              const updated = [...prev]
              updated[updated.length - 1] = { role: 'assistant', content: full }
              return updated
            })
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return
      setError(err.message || 'Connection error. Please try again.')
      setMessages(prev => prev.slice(0, -1)) // remove empty placeholder
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const stopGeneration = () => {
    abortRef.current?.abort()
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-[620px] shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white rounded-t-xl">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white text-sm font-bold">AI</div>
        <div>
          <div className="font-semibold text-gray-800 text-sm">English AI Tutor</div>
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
            {loading ? 'Typing...' : `Adapted to ${userLevel} level`}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">AI</div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-gray-50 border border-gray-100 text-gray-800 rounded-bl-sm'
              }`}
            >
              {msg.role === 'assistant' && msg.content === '' && loading && i === messages.length - 1 ? (
                <div className="flex gap-1 py-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              ) : msg.role === 'assistant' ? (
                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <span>⚠️</span> {error}
            <button onClick={() => setError('')} className="ml-auto font-bold text-red-400 hover:text-red-600">×</button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions — only on first message */}
      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <div className="text-xs text-gray-400 mb-2">{t('suggestions')}</div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {SUGGESTIONS.slice(0, 4).map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                className="flex-shrink-0 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors border border-blue-100 whitespace-nowrap"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-100 p-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('placeholder')}
            disabled={loading}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 bg-gray-50"
          />
          {loading ? (
            <button
              type="button"
              onClick={stopGeneration}
              className="bg-red-100 text-red-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-red-200 transition-colors"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-40"
            >
              {t('send')}
            </button>
          )}
        </form>
        <div className="text-center text-xs text-gray-300 mt-1.5">Powered by Claude AI · Level {userLevel}</div>
      </div>
    </div>
  )
}
