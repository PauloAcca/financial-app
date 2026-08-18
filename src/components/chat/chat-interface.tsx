'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { ChatMessage, type Message } from './chat-message'
import { ChatInput } from './chat-input'

const QUICK_ACTIONS = [
  { label: '¿Cuánto tengo?', prompt: '¿Cuánto tengo en mis cuentas?' },
  { label: 'Registrar gasto', prompt: 'Quiero registrar un gasto' },
  { label: 'Resumen del mes', prompt: '¿Cómo va mi mes?' },
  { label: 'Ver presupuestos', prompt: '¿Cómo estoy con mis presupuestos este mes?' },
]

export function ChatInterface() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isLoading) return

      setInput('')
      setIsLoading(true)

      // Agregar mensaje del usuario
      const userMessage: Message = { role: 'user', content: trimmed }
      const updatedMessages = [...messages, userMessage]
      setMessages(updatedMessages)

      // Placeholder del asistente (streaming)
      const assistantId = Date.now()
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '', isStreaming: true, toolsUsed: [] },
      ])

      // Preparar historial para la API
      const apiMessages = updatedMessages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))

      try {
        abortRef.current = new AbortController()
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: apiMessages }),
          signal: abortRef.current.signal,
        })

        if (!res.ok || !res.body) {
          throw new Error('Error al conectar con el asistente.')
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let accumulated = ''
        const toolsUsed: string[] = []
        let didCreateTransaction = false

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const event = JSON.parse(line.slice(6))

              if (event.type === 'text') {
                accumulated += event.text
                setMessages((prev) => {
                  const next = [...prev]
                  const last = next[next.length - 1]
                  if (last?.role === 'assistant') {
                    next[next.length - 1] = {
                      ...last,
                      content: accumulated,
                      isStreaming: true,
                    }
                  }
                  return next
                })
              }

              if (event.type === 'tool') {
                if (!toolsUsed.includes(event.name)) {
                  toolsUsed.push(event.name)
                }
              }

              if (event.type === 'done') {
                if (event.transactionCreated) didCreateTransaction = true
              }
            } catch {
              // chunk parcial, ignorar
            }
          }
        }

        // Finalizar el mensaje del asistente
        setMessages((prev) => {
          const next = [...prev]
          const last = next[next.length - 1]
          if (last?.role === 'assistant') {
            next[next.length - 1] = {
              ...last,
              content: accumulated || 'No pude generar una respuesta. Intentá de nuevo.',
              isStreaming: false,
              toolsUsed,
            }
          }
          return next
        })

        // Si se creó una transacción, refrescar datos del server
        if (didCreateTransaction) {
          router.refresh()
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return
        console.error('[chat-interface]', err)
        setMessages((prev) => {
          const next = [...prev]
          const last = next[next.length - 1]
          if (last?.role === 'assistant') {
            next[next.length - 1] = {
              ...last,
              content: 'Hubo un error al conectar con el asistente. Intentá de nuevo.',
              isStreaming: false,
            }
          }
          return next
        })
      } finally {
        setIsLoading(false)
        abortRef.current = null
      }
    },
    [messages, isLoading, router]
  )

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {isEmpty ? (
          <EmptyState onQuickAction={sendMessage} />
        ) : (
          <div className="flex flex-col gap-5 max-w-3xl mx-auto">
            {messages.map((msg, i) => (
              <ChatMessage key={i} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-[var(--color-border)] px-4 py-4 bg-[var(--color-surface)]">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={() => sendMessage(input)}
            isLoading={isLoading}
          />
          <p className="text-center text-[10px] text-[var(--color-text-muted)] mt-2">
            Enter para enviar · Shift+Enter para nueva línea
          </p>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onQuickAction }: { onQuickAction: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 text-center px-4">
      {/* Icon */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
      >
        <Sparkles size={28} className="text-white" />
      </div>

      <div>
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
          Asistente financiero
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] max-w-sm">
          Registrá gastos, consultá saldos y analizá tus finanzas en lenguaje natural.
        </p>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2 justify-center max-w-sm">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => onQuickAction(action.prompt)}
            className="px-4 py-2 rounded-full text-sm font-medium
                       bg-[var(--color-surface-2)] border border-[var(--color-border)]
                       text-[var(--color-text-secondary)]
                       hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]
                       hover:bg-[var(--color-accent-subtle)]
                       transition-all duration-150 cursor-pointer"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  )
}
