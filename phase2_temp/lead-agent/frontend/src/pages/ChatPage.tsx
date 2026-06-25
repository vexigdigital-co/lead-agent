import { useState, useRef, useEffect } from 'react'
import { chatApi } from '../lib/api'
import type { Message, Conversation } from '../types'

interface ExtractedFields {
  name?: string; email?: string; company?: string
  useCase?: string; budgetRange?: string; timeline?: string
}

const FIELD_LABELS: Record<string, string> = {
  name: '👤 Name', email: '📧 Email', company: '🏢 Company',
  useCase: '💡 Use case', budgetRange: '💰 Budget', timeline: '📅 Timeline',
}

export function ChatPage() {
  const [conv, setConv]           = useState<Conversation | null>(null)
  const [messages, setMessages]   = useState<Message[]>([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [starting, setStarting]   = useState(false)
  const [fields, setFields]       = useState<ExtractedFields>({})
  const [isComplete, setIsComplete] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const startChat = async () => {
    setStarting(true)
    try {
      const conversation = await chatApi.start()
      setConv(conversation)
      setMessages(conversation.messages)
    } catch (e) { console.error(e) }
    finally { setStarting(false) }
  }

  const send = async () => {
    if (!input.trim() || !conv || loading) return
    const text = input.trim()
    setInput('')

    const optimistic: Message = {
      id: `temp-${Date.now()}`, createdAt: new Date().toISOString(),
      conversationId: conv.id, role: 'USER', content: text,
    }
    setMessages(m => [...m, optimistic])
    setLoading(true)

    try {
      const res = await chatApi.send(conv.sessionId, text) as any
      const { message, extractedData, isComplete: done } = res

      setMessages(m => [...m.filter(x => x.id !== optimistic.id), optimistic, message])

      if (extractedData) {
        setFields(f => ({ ...f, ...extractedData }))
      }
      if (done) setIsComplete(true)
    } catch (e) {
      setMessages(m => m.filter(x => x.id !== optimistic.id))
      console.error(e)
    } finally { setLoading(false) }
  }

  const filledCount = Object.values(fields).filter(Boolean).length
  const progress = Math.round((filledCount / 6) * 100)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white mb-1">Chat demo</h1>
        <p className="text-zinc-500 text-sm">AI conversation agent — collects and qualifies leads in real time</p>
      </div>

      <div className="flex gap-6 max-w-5xl">
        {/* Chat */}
        <div className="flex-1 bg-[#0d0d14] border border-white/5 rounded-xl overflow-hidden flex flex-col" style={{ height: '580px' }}>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {!conv ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-14 h-14 rounded-full bg-violet-600/20 flex items-center justify-center text-3xl">🤖</div>
                <p className="text-zinc-500 text-sm text-center max-w-xs">
                  The AI agent will chat naturally and extract lead info in the background
                </p>
                <button
                  onClick={startChat}
                  disabled={starting}
                  className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                >
                  {starting ? 'Starting...' : 'Start conversation'}
                </button>
              </div>
            ) : (
              <>
                {messages.filter(m => m.role !== 'SYSTEM').map(msg => (
                  <div key={msg.id} className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'ASSISTANT' && (
                      <div className="w-7 h-7 rounded-full bg-violet-600/30 flex items-center justify-center text-xs mr-2 mt-1 shrink-0">🤖</div>
                    )}
                    <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'USER'
                        ? 'bg-violet-600 text-white rounded-br-sm'
                        : 'bg-white/5 text-zinc-200 rounded-bl-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="w-7 h-7 rounded-full bg-violet-600/30 flex items-center justify-center text-xs mr-2 mt-1 shrink-0">🤖</div>
                    <div className="bg-white/5 rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex gap-1 items-center h-4">
                        {[0,150,300].map(d => (
                          <div key={d} className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {isComplete && (
                  <div className="flex justify-center">
                    <div className="text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-4 py-1.5">
                      ✓ Lead captured and qualified
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {conv && !isComplete && (
            <div className="border-t border-white/5 p-4">
              <div className="flex gap-3">
                <input
                  type="text" value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                  placeholder="Type a message..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-violet-500/50"
                />
                <button
                  onClick={send} disabled={!input.trim() || loading}
                  className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live field extraction panel */}
        <div className="w-64 shrink-0 space-y-4">
          <div className="bg-[#0d0d14] border border-white/5 rounded-xl p-5">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">Extracted fields</p>

            {/* Progress bar */}
            <div className="mb-5">
              <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
                <span>Completeness</span>
                <span>{filledCount}/6</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-3">
              {Object.entries(FIELD_LABELS).map(([key, label]) => {
                const value = fields[key as keyof ExtractedFields]
                return (
                  <div key={key}>
                    <p className="text-xs text-zinc-600 mb-0.5">{label}</p>
                    <p className={`text-xs font-medium truncate ${value ? 'text-zinc-200' : 'text-zinc-700'}`}>
                      {value || '—'}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Score indicator */}
          {isComplete && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
              <p className="text-xs font-medium text-emerald-400 mb-1">✓ Lead saved</p>
              <p className="text-xs text-emerald-600">Qualifier agent is scoring this lead. Check the Leads page.</p>
            </div>
          )}

          {!conv && (
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
              <p className="text-xs text-zinc-600">Fields will appear here as the AI extracts them from the conversation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
