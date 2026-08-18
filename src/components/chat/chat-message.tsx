'use client'

import { User, Sparkles, CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Message {
  role: 'user' | 'assistant'
  content: string
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
        'flex gap-3 animate-fade-in',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5',
          isUser
            ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
            : 'text-white'
        )}
        style={
          !isUser
            ? { background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }
            : undefined
        }
      >
        {isUser ? <User size={15} /> : <Sparkles size={15} />}
      </div>

      {/* Bubble */}
      <div className={cn('flex flex-col gap-1 max-w-[80%]', isUser && 'items-end')}>
        <div
          className={cn(
            'px-4 py-3 rounded-2xl text-sm leading-relaxed',
            isUser
              ? 'bg-[var(--color-accent)] text-white rounded-tr-sm'
              : 'bg-[var(--color-surface-2)] text-[var(--color-text-primary)] rounded-tl-sm border border-[var(--color-border)]'
          )}
        >
          {message.isStreaming && !message.content ? (
            <span className="flex items-center gap-2 text-[var(--color-text-muted)]">
              <Loader2 size={14} className="animate-spin" />
              <span>Pensando...</span>
            </span>
          ) : (
            <MessageContent content={message.content} isStreaming={message.isStreaming} />
          )}
        </div>

        {/* Tool badge */}
        {message.toolsUsed && message.toolsUsed.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {message.toolsUsed.map((tool) => (
              <span
                key={tool}
                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full
                           bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
              >
                <CheckCircle2 size={9} />
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
  // Split por líneas y renderizar negrita básica (**texto**)
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
        <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse align-middle" />
      )}
    </div>
  )
}

function InlineMarkdown({ text }: { text: string }) {
  // Parsear **negrita**
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
    create_transaction: 'Transacción creada',
    get_accounts: 'Saldos consultados',
    get_categories: 'Categorías cargadas',
    get_transactions: 'Movimientos consultados',
    get_budget_status: 'Presupuesto revisado',
    get_monthly_summary: 'Resumen mensual',
  }
  return labels[tool] ?? tool
}
