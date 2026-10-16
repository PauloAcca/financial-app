'use client'

import { formatCurrency } from '@/lib/utils'

interface FixedVariableSplitProps {
  fixed: number
  variable: number
  currency: string
}

export function FixedVariableSplit({ fixed, variable, currency }: FixedVariableSplitProps) {
  const total = fixed + variable
  const fixedPct = total > 0 ? (fixed / total) * 100 : 0
  const variablePct = total > 0 ? (variable / total) * 100 : 0

  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-1.5 w-full rounded-[var(--radius-full)] overflow-hidden bg-[rgba(255,255,255,0.06)]">
        <div
          className="h-full bg-[var(--color-info)] transition-all"
          style={{ width: `${fixedPct}%` }}
        />
        <div
          className="h-full bg-[var(--color-warning)] transition-all"
          style={{ width: `${variablePct}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
            <span className="w-2 h-2 rounded-full bg-[var(--color-info)]" />
            Fijos
          </span>
          <span className="text-sm font-semibold text-[var(--color-text-primary)] tabular-nums">
            {formatCurrency(fixed, currency)}
          </span>
          <span className="text-[0.6875rem] text-[var(--color-text-muted)]">{fixedPct.toFixed(1)}% del gasto</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
            <span className="w-2 h-2 rounded-full bg-[var(--color-warning)]" />
            Variables
          </span>
          <span className="text-sm font-semibold text-[var(--color-text-primary)] tabular-nums">
            {formatCurrency(variable, currency)}
          </span>
          <span className="text-[0.6875rem] text-[var(--color-text-muted)]">{variablePct.toFixed(1)}% del gasto</span>
        </div>
      </div>
    </div>
  )
}
