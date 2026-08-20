'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Plus, Bot } from 'lucide-react'
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
  const [isInitialized, setIsInitialized] = useState(false)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Cargar estado inicial desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem('app_finanzas_chat_history')
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Message[]
        setMessages(parsed.map(m => m.role === 'assistant' ? { ...m, isStreaming: false } : m))
      } catch (e) {
        console.error('Failed to parse chat history', e)
      }
    }
    setIsInitialized(true)
  }, [])

  // Guardar en localStorage cuando hay cambios
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('app_finanzas_chat_history', JSON.stringify(messages))
    }
  }, [messages, isInitialized])

  // Scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(
    async (text: string, audioData?: { base64: string; mimeType: string }) => {
      const trimmed = text.trim()
      if ((!trimmed && !audioData) || isLoading) return

      setInput('')
      setIsLoading(true)

      // Agregar mensaje del usuario
      const userMessage: Message = { role: 'user', content: trimmed, audioData }
      const updatedMessages = [...messages, userMessage]
      setMessages(updatedMessages)

      // Placeholder del asistente (streaming)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '', isStreaming: true, toolsUsed: [] },
      ])

      // Preparar historial para la API
      const apiMessages = updatedMessages.map((m) => {
        const parts: any[] = []
        if (m.audioData) {
          parts.push({
            inlineData: {
              data: m.audioData.base64,
              mimeType: m.audioData.mimeType,
            },
          })
        }
        if (m.content) {
          parts.push({ text: m.content })
        } else if (m.audioData) {
          parts.push({ text: 'Analizá este audio' })
        }

        return {
          role: m.role === 'assistant' ? 'model' : 'user',
          parts,
        }
      })

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

  if (!isInitialized) {
    return (
      <div className="flex flex-col h-full items-center justify-center font-mono">
        <div className="w-6 h-6 border-2 border-[#00FF66] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const isEmpty = messages.length === 0

  const handleNewChat = () => {
    if (window.confirm('¿Seguro que querés reiniciar la conversación?')) {
      setMessages([])
      abortRef.current?.abort()
    }
  }

  return (
    <div className="flex flex-col h-full relative font-mono">
      {/* Messages area */}
      <div className="flex flex-col flex-1 overflow-y-auto px-4 py-4">
        {isEmpty ? (
          <EmptyState onQuickAction={sendMessage} />
        ) : (
          <div className="flex flex-col gap-4 max-w-lg w-full mx-auto relative pt-7 mt-auto">
            <div className="absolute top-0 right-0 z-10">
              <button
                onClick={handleNewChat}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-[11px] font-bold bg-[#181c31] text-[#8B92A9] border border-[#293056] hover:text-[#ff4d6d] hover:border-[#ff4d6d]/40 transition-colors cursor-pointer"
              >
                <Plus size={13} className="rotate-45" />
                LIMPIAR
              </button>
            </div>
            {messages.map((msg, i) => (
              <ChatMessage key={i} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area pegado a la navegación */}
      <div className="shrink-0 border-t border-[#1e233f] px-3 py-2.5 bg-[#111424]">
        <div className="max-w-lg mx-auto">
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={(audioData) => sendMessage(input, audioData)}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onQuickAction }: { onQuickAction: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-4">
      {/* Icon */}
      <div className="w-14 h-14 rounded-[4px] border border-[#00FF66] bg-[#181c31] flex items-center justify-center shadow-[0_0_12px_rgba(0,255,102,0.3)]">
        <Bot size={28} className="text-[#00FF66]" />
      </div>

      <div>
        <h2 className="text-base font-bold text-[#00FF66] tracking-wider uppercase glow-text-green mb-1.5">
          ORÁCULO INTELIGENTE IA
        </h2>
        <p className="text-xs text-[#8B92A9] max-w-xs leading-relaxed">
          Registrá gastos por voz o texto, consultá saldos y analizá tu rendimiento financiero en lenguaje natural.
        </p>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2 justify-center max-w-sm">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => onQuickAction(action.prompt)}
            className="px-3 py-1.5 rounded-[4px] text-xs font-bold
                       bg-[#181c31] border border-[#293056]
                       text-white
                       hover:border-[#00FF66] hover:text-[#00FF66] hover:bg-[#1e233d]
                       transition-all duration-150 cursor-pointer"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  )
}
