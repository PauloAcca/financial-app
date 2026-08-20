'use client'

import { User, Bot, CheckCircle2, Loader2, Mic } from 'lucide-react'
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
        'flex gap-2.5 animate-fade-in font-mono',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-[4px] border flex items-center justify-center shrink-0 mt-0.5',
          isUser
            ? 'border-[#00FF66] bg-[#111424] text-[#00FF66]'
            : 'border-[#38d9f5] bg-[#111424] text-[#38d9f5] shadow-[0_0_8px_rgba(56,217,245,0.3)]'
        )}
      >
        {isUser ? <User size={15} /> : <Bot size={16} />}
      </div>

      {/* Bubble */}
      <div className={cn('flex flex-col gap-1 max-w-[85%]', isUser && 'items-end')}>
        <div
          className={cn(
            'px-3.5 py-2.5 rounded-[4px] text-xs sm:text-sm leading-relaxed border',
            isUser
              ? 'bg-[#00FF66] text-black border-[#00FF66] font-bold shadow-[0_0_10px_rgba(0,255,102,0.25)]'
              : 'bg-[#181c31] text-white border-[#293056] shadow-sm'
          )}
        >
          {message.isStreaming && !message.content ? (
            <span className="flex items-center gap-2 text-[#8B92A9]">
              <Loader2 size={14} className="animate-spin text-[#00FF66]" />
              <span>Procesando datos del oráculo...</span>
            </span>
          ) : (
            <div className="flex flex-col gap-2">
              {message.audioData && (
                <div className={cn(
                  'flex items-center gap-2 text-xs pb-1 mb-1 border-b',
                  isUser ? 'border-black/20 text-black' : 'border-[#293056] text-[#38d9f5]'
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
                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-[2px]
                           bg-[#14182b] border border-[#00FF66]/40 text-[#00FF66]"
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
        <span className="inline-block w-1.5 h-3.5 bg-[#00FF66] ml-1 animate-pulse align-middle" />
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
          <strong key={i} className="font-bold underline decoration-dotted">
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
    create_transaction: 'Misión / Gasto registrado',
    get_accounts: 'Bóvedas consultadas',
    get_categories: 'Categorías cargadas',
    get_transactions: 'Historial analizado',
    get_budget_status: 'Presupuestos revisados',
    get_monthly_summary: 'Resumen mensual calculado',
  }
  return labels[tool] ?? tool
}
