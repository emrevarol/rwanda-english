'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { markDailyTaskDone } from '@/lib/dailyComplete'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatSessionItem {
  id: string
  title: string
  updatedAt: string
  preview: string
}

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

  const suggestions = [
    t('suggestion1'), t('suggestion2'), t('suggestion3'), t('suggestion4'),
    t('suggestion5'), t('suggestion6'), t('suggestion7'), t('suggestion8'),
  ]

  const greeting: Message = {
    role: 'assistant',
    content: t('greeting', { name: userName, level: userLevel }),
  }

  const [messages, setMessages] = useState<Message[]>([greeting])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastFailedText, setLastFailedText] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<ChatSessionItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const prevMessagesLenRef = useRef(1)

  // Smart scroll: new user message → scroll to bottom;
  // streaming assistant response → only scroll if user was already near bottom
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const isNewMessage = messages.length > prevMessagesLenRef.current
    prevMessagesLenRef.current = messages.length

    if (isNewMessage) {
      // New message added — scroll to show the start of it
      const lastMsg = container.querySelector('[data-msg]:last-child')
      if (lastMsg) {
        lastMsg.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } else {
      // Streaming update — only auto-scroll if user is near bottom
      const { scrollTop, scrollHeight, clientHeight } = container
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [messages])

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/tutor/sessions')
      if (res.ok) setSessions(await res.json())
    } catch {}
  }

  const loadSession = async (id: string) => {
    try {
      const res = await fetch(`/api/tutor/sessions/${id}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages.length > 0 ? data.messages : [greeting])
        setSessionId(id)
        setShowHistory(false)
      }
    } catch {}
  }

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await fetch(`/api/tutor/sessions/${id}`, { method: 'DELETE' })
    setSessions((prev) => prev.filter((s) => s.id !== id))
    if (sessionId === id) startNewChat()
  }

  const startNewChat = () => {
    setMessages([greeting])
    setSessionId(null)
    setShowHistory(false)
    setError('')
  }

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
        body: JSON.stringify({ messages: history, sessionId }),
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
            const parsed = JSON.parse(data)
            if (parsed.sessionId && !sessionId) {
              setSessionId(parsed.sessionId)
            }
            if (parsed.text) {
              full += parsed.text
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: 'assistant', content: full }
                return updated
              })
            }
          } catch {}
        }
      }
      // Refresh sessions list
      fetchSessions()
      // Auto-mark daily plan task as done
      markDailyTaskDone('tutor')
    } catch (err: any) {
      if (err.name === 'AbortError') return
      setError(err.message || 'Connection error. Please try again.')
      setLastFailedText(text)
      setMessages(prev => prev.slice(0, -1))
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
    <div className="flex gap-3 h-[calc(100vh-12rem)]">
      {/* History sidebar */}
      <div className={`${showHistory ? 'flex' : 'hidden'} md:flex flex-col w-64 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-shrink-0`}>
        <div className="p-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">{t('chatHistory')}</span>
            <button
              onClick={startNewChat}
              className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-lg hover:bg-blue-700 transition-colors"
            >
              + {t('newChat')}
            </button>
          </div>
          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchChats')}
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="p-4 text-xs text-gray-600 text-center">{t('noHistory')}</div>
          ) : (
            sessions
              .filter((s) => !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((s) => {
                const date = new Date(s.updatedAt)
                const today = new Date()
                const isToday = date.toDateString() === today.toDateString()
                const yesterday = new Date(today)
                yesterday.setDate(yesterday.getDate() - 1)
                const isYesterday = date.toDateString() === yesterday.toDateString()
                const dateStr = isToday
                  ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : isYesterday
                  ? t('yesterday')
                  : date.toLocaleDateString([], { day: 'numeric', month: 'short' })

                return (
                  <div
                    key={s.id}
                    onClick={() => loadSession(s.id)}
                    className={`px-3 py-2.5 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors group ${
                      sessionId === s.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="text-sm font-medium text-gray-800 truncate flex-1">{s.title}</div>
                      <button
                        onClick={(e) => deleteSession(s.id, e)}
                        className="text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 text-xs flex-shrink-0"
                      >
                        ×
                      </button>
                    </div>
                    <div className="text-[11px] text-gray-600 mt-0.5">{dateStr}</div>
                  </div>
                )
              })
          )}
          {searchQuery && sessions.filter((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
            <div className="p-4 text-xs text-gray-600 text-center">{t('noResults')}</div>
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col shadow-sm min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white rounded-t-xl">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
          >
            ☰
          </button>
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white text-sm font-bold">AI</div>
          <div className="flex-1">
            <div className="font-semibold text-gray-800 text-sm">{t('headerTitle')}</div>
            <div className="text-xs text-gray-600 flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
              {loading ? t('typing') : t('adaptedTo', { level: userLevel })}
            </div>
          </div>
          {sessionId && (
            <button onClick={startNewChat} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              + {t('newChat')}
            </button>
          )}
        </div>

        {/* Messages */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} data-msg className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
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

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
              <span>⚠️</span> {error}
              {lastFailedText && (
                <button
                  onClick={() => { setError(''); sendMessage(lastFailedText) }}
                  className="ml-auto text-xs bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200 font-medium transition-colors"
                >
                  {t('retry')}
                </button>
              )}
              <button onClick={() => { setError(''); setLastFailedText('') }} className="font-bold text-red-400 hover:text-red-600">×</button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions — only on first message */}
        {messages.length === 1 && (
          <div className="px-4 pb-2">
            <div className="text-xs text-gray-600 mb-2">{t('suggestions')}</div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {suggestions.slice(0, 4).map((q, i) => (
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
                {t('stop')}
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
          <div className="text-center text-xs text-gray-500 mt-1.5">{t('poweredBy', { level: userLevel })}</div>
        </div>
      </div>
    </div>
  )
}
