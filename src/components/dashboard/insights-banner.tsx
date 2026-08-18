'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, Lightbulb, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Insight } from '@/types/database'

interface InsightsBannerProps {
  insights: Insight[]
}

const TYPE_CONFIG = {
  alert: {
    icon: AlertTriangle,
    color: 'text-[var(--color-warning)]',
    bg: 'bg-[var(--color-warning-subtle)]',
    border: 'border-[var(--color-warning)]',
  },
  tip: {
    icon: Lightbulb,
    color: 'text-[var(--color-success)]',
    bg: 'bg-[var(--color-success-subtle)]',
    border: 'border-[var(--color-success)]',
  },
  summary: {
    icon: TrendingUp,
    color: 'text-[var(--color-accent)]',
    bg: 'bg-[var(--color-accent-subtle)]',
    border: 'border-[var(--color-accent)]',
  },
  anomaly: {
    icon: TrendingDown,
    color: 'text-[var(--color-danger)]',
    bg: 'bg-[var(--color-danger-subtle)]',
    border: 'border-[var(--color-danger)]',
  },
}

export function InsightsBanner({ insights }: InsightsBannerProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visible = insights.filter((i) => !dismissed.has(i.id))
  if (visible.length === 0) return null

  async function dismiss(id: string) {
    setDismissed((prev) => new Set([...prev, id]))
    // Fire-and-forget: marcar como dismissed en la DB
    await fetch('/api/insights/dismiss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(() => {})
  }

  return (
    <div className="flex flex-col gap-3">
      {visible.map((insight) => {
        const config = TYPE_CONFIG[insight.type] ?? TYPE_CONFIG.tip
        const Icon = config.icon
        return (
          <div
            key={insight.id}
            className={cn(
              'flex items-start gap-3 p-4 rounded-[var(--radius-lg)] border-l-4 animate-fade-in',
              config.bg,
              config.border
            )}
          >
            <Icon size={18} className={cn('shrink-0 mt-0.5', config.color)} />
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-semibold', config.color)}>{insight.title}</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                {insight.message}
              </p>
            </div>
            <button
              onClick={() => dismiss(insight.id)}
              className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
              aria-label="Descartar insight"
            >
              <X size={15} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
