'use client'

import { useTransition } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { deleteInvestmentValuation } from '@/actions/investments'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import type { InvestmentPlatform } from '@/lib/investments'
import {
  TrendingUp,
  TrendingDown,
  ArrowDownLeft,
  ArrowUpRight,
  Pencil,
  Trash2,
  History,
  Gauge,
} from 'lucide-react'

interface InvestmentDetailModalProps {
  open: boolean
  onClose: () => void
  platform: InvestmentPlatform | null
  onUpdateValue: (platform: InvestmentPlatform) => void
  onContribute: (platform: InvestmentPlatform) => void
  onDataChanged?: () => void
}

export function InvestmentDetailModal({
  open,
  onClose,
  platform,
  onUpdateValue,
  onContribute,
  onDataChanged,
}: InvestmentDetailModalProps) {
  const [isPending, startTransition] = useTransition()

  if (!platform) return null

  const { account, capital, currentValue, gain, gainPct, since, movements, valuations } = platform
  const isUp = gain >= 0
  const currency = account.currency

  function handleDeleteValuation(id: string) {
    if (!confirm('¿Eliminar esta valuación?')) return
    startTransition(async () => {
      const res = await deleteInvestmentValuation(id)
      if (res.success) {
        toast.success('Valuación eliminada.')
        onDataChanged?.()
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={account.name}
      description="Detalle de la inversión, aportes y valuaciones."
      size="lg"
    >
      <div className="flex flex-col gap-4 pt-1">
        {/* Resumen */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-[var(--radius-md)] p-3">
            <p className="text-xs font-medium text-[var(--color-text-secondary)] flex items-center gap-1">
              <Gauge size={12} /> Valor actual
            </p>
            <p className="text-base font-semibold text-[var(--color-text-primary)] tabular-nums mt-1">
              {formatCurrency(currentValue, currency)}
            </p>
          </div>
          <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-[var(--radius-md)] p-3">
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">
              Capital aportado
            </p>
            <p className="text-base font-semibold text-[var(--color-transfer)] tabular-nums mt-1">
              {formatCurrency(capital, currency)}
            </p>
          </div>
          <div
            className={cn(
              'bg-[rgba(255,255,255,0.04)] border rounded-[var(--radius-md)] p-3 col-span-2',
              isUp ? 'border-[rgba(127,217,164,0.35)]' : 'border-[rgba(227,160,170,0.35)]'
            )}
          >
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">
              Ganancia / pérdida
            </p>
            <p
              className={cn(
                'text-lg font-semibold tabular-nums mt-1 flex items-center gap-2 flex-wrap',
                isUp ? 'text-[var(--color-income)]' : 'text-[var(--color-expense)]'
              )}
            >
              {isUp ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              {isUp ? '+' : ''}
              {formatCurrency(gain, currency)}
              {gainPct !== null && (
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
                    isUp
                      ? 'bg-[var(--color-income-subtle)] text-[var(--color-income)]'
                      : 'bg-[var(--color-expense-subtle)] text-[var(--color-expense)]'
                  )}
                >
                  {isUp ? '+' : ''}
                  {gainPct.toFixed(2)}%
                </span>
              )}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1.5">
              Invertido desde {formatDate(since, 'medium')}
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="primary" onClick={() => onUpdateValue(platform)}>
            <Pencil size={14} />
            Actualizar valor
          </Button>
          <Button variant="secondary" onClick={() => onContribute(platform)}>
            <ArrowDownLeft size={14} />
            Aporte / retiro
          </Button>
        </div>

        {/* Historial de valores */}
        {valuations.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-[var(--color-text-secondary)] flex items-center gap-1.5 mb-2">
              <Gauge size={14} />
              <span>Historial de valores ({valuations.length})</span>
            </h3>
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
              {valuations.map((v) => (
                <div
                  key={v.id}
                  className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-[var(--radius-md)] px-3 py-2 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[var(--color-text-primary)] tabular-nums">
                      {formatCurrency(Number(v.value), v.currency)}
                    </p>
                    <p className="text-[0.6875rem] text-[var(--color-text-secondary)] truncate">
                      {formatDate(v.valued_at, 'medium')}
                      {v.notes ? ` · ${v.notes}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteValuation(v.id)}
                    disabled={isPending}
                    className="p-1.5 rounded-[var(--radius-sm)] bg-[rgba(255,255,255,0.06)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)] transition-colors shrink-0 disabled:opacity-40 cursor-pointer"
                    title="Eliminar valuación"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Movimientos */}
        <div>
          <h3 className="text-xs font-medium text-[var(--color-text-secondary)] flex items-center gap-1.5 mb-2">
            <History size={14} />
            <span>Movimientos ({movements.length})</span>
          </h3>
          {movements.length === 0 ? (
            <p className="text-xs text-[var(--color-text-secondary)] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-[var(--radius-md)] p-3 text-center">
              Todavía no registraste aportes ni retiros en esta inversión.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
              {movements.map((m) => {
                const isIn = m.direction === 'in'
                return (
                  <div
                    key={m.id}
                    className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-[var(--radius-md)] px-3 py-2 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          'w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0',
                          isIn
                            ? 'bg-[var(--color-income-subtle)] text-[var(--color-income)]'
                            : 'bg-[var(--color-expense-subtle)] text-[var(--color-expense)]'
                        )}
                      >
                        {isIn ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-[var(--color-text-primary)] truncate">
                          {m.description || (isIn ? 'Aporte' : 'Retiro')}
                        </p>
                        <p className="text-[0.6875rem] text-[var(--color-text-secondary)]">
                          {formatDate(m.date, 'medium')}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'text-xs font-semibold tabular-nums shrink-0',
                        isIn ? 'text-[var(--color-income)]' : 'text-[var(--color-expense)]'
                      )}
                    >
                      {isIn ? '+' : '-'}
                      {formatCurrency(m.amount, currency)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
