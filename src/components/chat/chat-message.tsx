'use client'

import { User, Bot, CheckCircle2, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Message {
  role: 'user' | 'assistant'
  content: string
  audioData?: {
    base64: string
    mimeType: string
  }
  isStreaming?: boolean
  toolsUsed?: string[]
}

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn(
        'flex gap-2.5 animate-fade-in',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-[var(--radius-sm)] border flex items-center justify-center shrink-0 mt-0.5',
          isUser
            ? 'border-[rgba(143,203,176,0.3)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
            : 'border-[rgba(166,185,232,0.3)] bg-[var(--color-info-subtle)] text-[var(--color-info)]'
        )}
      >
        {isUser ? <User size={15} /> : <Bot size={16} />}
      </div>

      {/* Bubble */}
      <div className={cn('flex flex-col gap-1 max-w-[85%]', isUser && 'items-end')}>
        <div
          className={cn(
            'px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed tabular-nums',
            isUser
              ? 'bg-[var(--color-accent-subtle)] border border-[rgba(143,203,176,0.3)] text-[var(--color-text-primary)] rounded-[var(--radius-lg)] rounded-br-sm font-medium'
              : 'glass rounded-[var(--radius-lg)] rounded-bl-sm text-[var(--color-text-primary)]'
          )}
        >
          {message.isStreaming && !message.content ? (
            <span className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
              <span>Pensando</span>
              <span className="flex items-center gap-1 py-1">
                <span className="w-1 h-1 rounded-full bg-current animate-pulse" />
                <span className="w-1 h-1 rounded-full bg-current animate-pulse [animation-delay:150ms]" />
                <span className="w-1 h-1 rounded-full bg-current animate-pulse [animation-delay:300ms]" />
              </span>
            </span>
          ) : (
            <div className="flex flex-col gap-2">
              {message.audioData && (
                <div className={cn(
                  'flex items-center gap-2 text-xs pb-1 mb-1 border-b',
                  isUser
                    ? 'border-[rgba(143,203,176,0.25)] text-[var(--color-accent)]'
                    : 'border-[rgba(255,255,255,0.06)] text-[var(--color-info)]'
                )}>
                  <Mic size={13} />
                  <span>Audio registrado</span>
                </div>
              )}
              {message.content && (
                <MessageContent content={message.content} isStreaming={message.isStreaming} />
              )}
            </div>
          )}
        </div>

        {/* Tool badge */}
        {message.toolsUsed && message.toolsUsed.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {message.toolsUsed.map((tool) => (
              <span
                key={tool}
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full
                           bg-[rgba(255,255,255,0.06)] text-[var(--color-text-secondary)]"
              >
                <CheckCircle2 size={10} />
                {toolLabel(tool)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Renderiza el contenido con soporte básico de markdown
function MessageContent({
  content,
  isStreaming,
}: {
  content: string
  isStreaming?: boolean
}) {
  const lines = content.split('\n')

  return (
    <div className="whitespace-pre-wrap break-words">
      {lines.map((line, i) => (
        <span key={i}>
          <InlineMarkdown text={line} />
          {i < lines.length - 1 && <br />}
        </span>
      ))}
      {isStreaming && (
        <span className="inline-block w-1.5 h-3.5 bg-[var(--color-accent)] rounded-sm ml-1 animate-pulse align-middle" />
      )}
    </div>
  )
}

function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

function toolLabel(tool: string): string {
  const labels: Record<string, string> = {
    create_transaction: 'Transacción registrada',
    get_accounts: 'Cuentas consultadas',
    get_categories: 'Categorías cargadas',
    get_transactions: 'Historial analizado',
    get_budget_status: 'Presupuestos revisados',
    get_monthly_summary: 'Resumen mensual calculado',
  }
  return labels[tool] ?? tool
}
