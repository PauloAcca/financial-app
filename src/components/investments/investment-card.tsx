'use client'

import { TrendingUp, TrendingDown, Calendar, ArrowDownLeft, ArrowUpRight, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { ACCOUNT_TYPE_CONFIG } from '@/lib/constants'
import type { InvestmentPlatform } from '@/lib/investments'

interface InvestmentCardProps {
  platform: InvestmentPlatform
  hidden: boolean
  onSelect: (platform: InvestmentPlatform) => void
  onUpdateValue: (platform: InvestmentPlatform) => void
  onContribute: (platform: InvestmentPlatform) => void
}

export function InvestmentCard({
  platform,
  hidden,
  onSelect,
  onUpdateValue,
  onContribute,
}: InvestmentCardProps) {
  const { account, capital, currentValue, gain, gainPct, hasValuation, since, lastValuedAt } = platform
  const isUp = gain >= 0
  const config = ACCOUNT_TYPE_CONFIG[account.type]

  function stop(e: React.MouseEvent) {
    e.stopPropagation()
  }

  return (
    <div
      onClick={() => onSelect(platform)}
      className={cn(
        'group glass rounded-[var(--radius-lg)] p-4 transition-all duration-300 cursor-pointer select-none',
        'hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(3,6,10,0.45)]',
        'active:translate-y-0 active:scale-[0.99]'
      )}
    >
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-10 h-10 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: `${account.color ?? config.defaultColor}20`,
              borderColor: `${account.color ?? config.defaultColor}55`,
              color: account.color ?? config.defaultColor,
            }}
          >
            <TrendingUp size={20} className="stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-[var(--color-text-primary)] text-sm sm:text-base truncate group-hover:text-[var(--color-accent)] transition-colors">
              {account.name}
            </h3>
            <span className="text-[0.6875rem] font-medium text-[var(--color-investment)]">
              {config.label} · {account.currency}
            </span>
          </div>
        </div>

        <button
          onClick={(e) => {
            stop(e)
            onUpdateValue(platform)
          }}
          className="p-1.5 rounded-[var(--radius-sm)] bg-[rgba(255,255,255,0.06)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-subtle)] transition-colors shrink-0 cursor-pointer"
          title="Actualizar valor"
        >
          <Pencil size={14} />
        </button>
      </div>

      {/* Números */}
      <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-[var(--radius-md)] p-3 mb-3">
        <p className="text-xs font-medium text-[var(--color-text-secondary)]">Valor actual</p>
        <p className="text-lg sm:text-xl font-semibold text-[var(--color-text-primary)] tabular-nums tracking-tight mt-1">
          {hidden ? '••••••' : formatCurrency(currentValue, account.currency)}
        </p>

        <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-[rgba(255,255,255,0.06)]">
          <div>
            <p className="text-[0.6875rem] text-[var(--color-text-muted)]">Aportado</p>
            <p className="text-xs font-medium text-[var(--color-text-secondary)] tabular-nums mt-0.5">
              {hidden ? '••••' : formatCurrency(capital, account.currency)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[0.6875rem] text-[var(--color-text-muted)]">Ganancia / pérdida</p>
            <p
              className={cn(
                'text-xs font-semibold tabular-nums flex items-center gap-1 justify-end mt-0.5',
                isUp ? 'text-[var(--color-income)]' : 'text-[var(--color-expense)]'
              )}
            >
              {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span className="flex items-center">
                {hidden
                  ? '••••'
                  : `${isUp ? '+' : ''}${formatCurrency(gain, account.currency)}`}
                {gainPct !== null && !hidden && (
                  <span
                    className={cn(
                      'ml-1 rounded-full px-1.5 py-px text-[0.625rem] font-medium tabular-nums',
                      gainPct >= 0
                        ? 'bg-[var(--color-income-subtle)] text-[var(--color-income)]'
                        : 'bg-[var(--color-expense-subtle)] text-[var(--color-expense)]'
                    )}
                  >
                    {gainPct >= 0 ? '+' : ''}
                    {gainPct.toFixed(2)}%
                  </span>
                )}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs pt-1">
        <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)] text-[11px]">
          <Calendar size={13} className="text-[var(--color-text-muted)]" />
          <span>
            {lastValuedAt
              ? `Valorado: ${formatDate(lastValuedAt, 'short')}`
              : hasValuation
              ? 'Valorado'
              : `Desde: ${formatDate(since, 'short')}`}
          </span>
        </div>

        <div className="flex items-center gap-1.5" onClick={stop}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onContribute(platform)}
            title="Registrar aporte o retiro"
          >
            <ArrowDownLeft size={12} className="stroke-[2.5]" />
            Aportar
          </Button>
        </div>
      </div>

      {!hasValuation && (
        <Button
          variant="secondary"
          className="mt-3 w-full bg-[var(--color-investment-subtle)] text-[var(--color-investment)] border-[rgba(191,174,232,0.35)] hover:bg-[rgba(191,174,232,0.22)] hover:border-[rgba(191,174,232,0.5)]"
          onClick={(e) => {
            stop(e)
            onUpdateValue(platform)
          }}
        >
          <ArrowUpRight size={12} />
          Cargar valor actual para ver la ganancia
        </Button>
      )}
    </div>
  )
}
