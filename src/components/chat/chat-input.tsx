'use client'

import { useRef, useEffect, KeyboardEvent } from 'react'
import { Send } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  value: string
  onChange: (val: string) => void
  onSubmit: () => void
  isLoading: boolean
  placeholder?: string
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  placeholder = 'Escribí un mensaje...',
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'
  }, [value])

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isLoading && value.trim()) onSubmit()
    }
  }

  const canSubmit = !isLoading && value.trim().length > 0

  return (
    <div
      className={cn(
        'flex items-end gap-3 p-3 rounded-[var(--radius-lg)]',
        'bg-[var(--color-surface-2)] border border-[var(--color-border)]',
        'transition-all duration-150',
        'focus-within:border-[var(--color-accent)] focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.15)]'
      )}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading}
        rows={1}
        className={cn(
          'flex-1 resize-none bg-transparent outline-none',
          'text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
          'leading-relaxed max-h-[200px] overflow-y-auto',
          'disabled:opacity-50'
        )}
        style={{ scrollbarWidth: 'thin' }}
      />
      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className={cn(
          'w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center shrink-0',
          'transition-all duration-150',
          canSubmit
            ? 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] shadow-[0_0_12px_rgba(99,102,241,0.4)]'
            : 'bg-[var(--color-surface-3)] text-[var(--color-text-muted)] cursor-not-allowed'
        )}
        aria-label="Enviar mensaje"
      >
        <Send size={16} />
      </button>
    </div>
  )
}
