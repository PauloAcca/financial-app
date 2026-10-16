'use client'

import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'

export interface CategoryComparisonItem {
  id?: string | null
  name: string
  current: number
  previous: number
  diff: number
  pct: number | null
  fill: string
}

interface CategoryComparisonProps {
  items: CategoryComparisonItem[]
  currency: string
  onSelect?: (id: string, name: string) => void
}

export function CategoryComparison({ items, currency, onSelect }: CategoryComparisonProps) {
  if (items.length === 0) {
    return (
      <p className="text-xs text-[var(--color-text-muted)] py-6 text-center">
        No hay gastos este mes.
      </p>
    )
  }

  return (
    <div className="flex flex-col divide-y divide-[rgba(255,255,255,0.06)]">
      {items.map((item) => {
        const isNew = item.previous === 0 && item.current > 0
        const up = item.pct !== null && item.pct > 0
        const down = item.pct !== null && item.pct < 0
        const clickable = !!item.id && !!onSelect

        return (
          <button
            key={item.name}
            type="button"
            disabled={!clickable}
            onClick={() => {
              if (item.id && onSelect) onSelect(item.id, item.name)
            }}
            className={cn(
              'flex items-center justify-between gap-3 py-2.5 text-left rounded-[var(--radius-md)]',
              clickable ? '-mx-2 px-2 hover:bg-[rgba(255,255,255,0.07)] transition-colors cursor-pointer' : ''
            )}
          >
            <span className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-xs text-[var(--color-text-secondary)] truncate">{item.name}</span>
            </span>

            <span className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-semibold text-[var(--color-text-primary)] tabular-nums">
                {formatCurrency(item.current, currency)}
              </span>

              {isNew ? (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-[var(--radius-full)] border border-[rgba(166,185,232,0.4)] text-[var(--color-info)] bg-[var(--color-info-subtle)]">
                  Nuevo
                </span>
              ) : item.pct === null ? (
                <span className="flex items-center gap-0.5 text-[10px] text-[var(--color-text-muted)] w-16 justify-end">
                  <Minus size={11} /> —
                </span>
              ) : (
                <span
                  className={cn(
                    'flex items-center gap-0.5 text-[10px] font-medium tabular-nums w-16 justify-end',
                    up
                      ? 'text-[var(--color-expense)]'
                      : down
                      ? 'text-[var(--color-income)]'
                      : 'text-[var(--color-text-muted)]'
                  )}
                  title={`Antes: ${formatCurrency(item.previous, currency)}`}
                >
                  {up ? <ArrowUpRight size={11} /> : down ? <ArrowDownRight size={11} /> : null}
                  {up ? '+' : ''}
                  {item.pct.toFixed(0)}%
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
