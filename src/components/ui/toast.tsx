'use client'

import { useEffect, useState, useCallback } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastVariant = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  variant: ToastVariant
}

// =========================================================
// Store global simple (sin dependencia externa)
// =========================================================
type Listener = (toasts: Toast[]) => void
const listeners: Listener[] = []
let toasts: Toast[] = []

function emit() {
  listeners.forEach((l) => l([...toasts]))
}

export function toast(message: string, variant: ToastVariant = 'success') {
  const id = Math.random().toString(36).slice(2)
  toasts = [...toasts, { id, message, variant }]
  emit()
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
  }, 4000)
}

// Shortcuts
toast.success = (msg: string) => toast(msg, 'success')
toast.error   = (msg: string) => toast(msg, 'error')
toast.warning = (msg: string) => toast(msg, 'warning')
toast.info    = (msg: string) => toast(msg, 'info')

// =========================================================
// Componente visual
// =========================================================
const iconMap: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle size={18} />,
  error:   <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info:    <Info size={18} />,
}

const styleMap: Record<ToastVariant, string> = {
  success: 'border-[var(--color-success)]/40 text-[var(--color-success)]',
  error:   'border-[var(--color-danger)]/40 text-[var(--color-danger)]',
  warning: 'border-[var(--color-warning)]/40 text-[var(--color-warning)]',
  info:    'border-[var(--color-info)]/40 text-[var(--color-info)]',
}

function ToastItem({ toast: t, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)]',
        'glass border shadow-[var(--shadow-lg)]',
        'animate-slide-in min-w-[260px] max-w-sm',
        styleMap[t.variant]
      )}
      role="alert"
    >
      <span className="shrink-0">{iconMap[t.variant]}</span>
      <p className="text-sm font-medium text-[var(--color-text-primary)] flex-1">{t.message}</p>
      <button
        onClick={() => onDismiss(t.id)}
        className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        aria-label="Cerrar notificación"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const [items, setItems] = useState<Toast[]>([])

  useEffect(() => {
    listeners.push(setItems)
    return () => {
      const idx = listeners.indexOf(setItems)
      if (idx !== -1) listeners.splice(idx, 1)
    }
  }, [])

  const dismiss = useCallback((id: string) => {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
  }, [])

  if (items.length === 0) return null

  return (
    <div
      className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end"
      aria-live="polite"
      aria-label="Notificaciones"
    >
      {items.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>
  )
}
