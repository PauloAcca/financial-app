'use client'

import { useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-xl',
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  className,
}: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-[#05070B]/70 backdrop-blur-md animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel de vidrio */}
      <div
        className={cn(
          'relative z-10 w-full glass-strong rounded-[var(--radius-lg)]',
          'animate-scale-in',
          'flex flex-col max-h-[90dvh] overflow-hidden',
          sizeMap[size],
          className
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-center justify-between p-5 pb-3 border-b border-[rgba(255,255,255,0.08)] shrink-0">
            <div>
              {title && (
                <h2
                  id="modal-title"
                  className="font-display text-lg font-semibold tracking-tight text-[var(--color-text-primary)]"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-[var(--color-text-secondary)] hover:bg-[rgba(255,255,255,0.08)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer shrink-0"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 min-h-0">{children}</div>
      </div>
    </div>
  )
}
