'use client'

import { useTransition } from 'react'
import { Modal } from '@/components/ui/modal'
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
      title={`📈 ${account.name.toUpperCase()}`}
      description="Detalle de la inversión, aportes y valuaciones."
      size="lg"
    >
      <div className="flex flex-col gap-4 font-mono pt-1">
        {/* Resumen */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-[#14182b] border border-[#293056] rounded-[4px] p-3">
            <p className="text-[10px] text-[#8B92A9] uppercase tracking-wider flex items-center gap-1">
              <Gauge size={12} /> VALOR ACTUAL
            </p>
            <p className="text-base font-bold text-white tabular-nums mt-1">
              {formatCurrency(currentValue, currency)}
            </p>
          </div>
          <div className="bg-[#14182b] border border-[#293056] rounded-[4px] p-3">
            <p className="text-[10px] text-[#8B92A9] uppercase tracking-wider">CAPITAL APORTADO</p>
            <p className="text-base font-bold text-[#38d9f5] tabular-nums mt-1">
              {formatCurrency(capital, currency)}
            </p>
          </div>
          <div
            className={cn(
              'bg-[#14182b] border rounded-[4px] p-3 col-span-2',
              isUp ? 'border-[#00FF66]/40' : 'border-[#ff4d6d]/40'
            )}
          >
            <p className="text-[10px] text-[#8B92A9] uppercase tracking-wider">GANANCIA / PÉRDIDA</p>
            <p
              className={cn(
                'text-lg font-bold tabular-nums mt-1 flex items-center gap-2',
                isUp ? 'text-[#00FF66] glow-text-green' : 'text-[#ff4d6d] glow-text-pink'
              )}
            >
              {isUp ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              {isUp ? '+' : ''}
              {formatCurrency(gain, currency)}
              {gainPct !== null && (
                <span className="text-sm">({isUp ? '+' : ''}{gainPct.toFixed(2)}%)</span>
              )}
            </p>
            <p className="text-[10px] text-[#5d6786] mt-1">
              Invertido desde {formatDate(since, 'medium')}
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onUpdateValue(platform)}
            className="btn-arcade-green py-2.5 px-3 rounded-[4px] text-xs font-bold text-black flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Pencil size={14} />
            <span>ACTUALIZAR VALOR</span>
          </button>
          <button
            onClick={() => onContribute(platform)}
            className="py-2.5 px-3 rounded-[4px] bg-[#181c31] border border-[#00FF66]/40 text-[#00FF66] text-xs font-bold uppercase tracking-wider hover:bg-[#00FF66]/10 transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
          >
            <ArrowDownLeft size={14} />
            <span>APORTE / RETIRO</span>
          </button>
        </div>

        {/* Historial de valuciones */}
        {valuations.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-[#a855f7] uppercase tracking-widest flex items-center gap-1.5 mb-2">
              <Gauge size={14} />
              <span>HISTORIAL DE VALORES ({valuations.length})</span>
            </h3>
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
              {valuations.map((v) => (
                <div
                  key={v.id}
                  className="bg-[#14182b] border border-[#293056] rounded-[4px] px-3 py-2 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white tabular-nums">
                      {formatCurrency(Number(v.value), v.currency)}
                    </p>
                    <p className="text-[10px] text-[#8B92A9] truncate">
                      {formatDate(v.valued_at, 'medium')}
                      {v.notes ? ` · ${v.notes}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteValuation(v.id)}
                    disabled={isPending}
                    className="p-1.5 rounded bg-[#20253f] text-[#5d6786] hover:text-[#ff4d6d] hover:bg-[#ff4d6d]/20 transition-colors shrink-0 disabled:opacity-40"
                    title="Eliminar valuación"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline de aportes/retiros */}
        <div>
          <h3 className="text-xs font-bold text-[#00FF66] uppercase tracking-widest flex items-center gap-1.5 mb-2">
            <History size={14} />
            <span>MOVIMIENTOS ({movements.length})</span>
          </h3>
          {movements.length === 0 ? (
            <p className="text-[11px] text-[#8B92A9] bg-[#14182b] border border-[#293056] rounded-[4px] p-3 text-center">
              Todavía no registraste aportes ni retiros en esta inversión.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
              {movements.map((m) => {
                const isIn = m.direction === 'in'
                return (
                  <div
                    key={m.id}
                    className="bg-[#14182b] border border-[#293056] rounded-[4px] px-3 py-2 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={cn(
                          'w-7 h-7 rounded-[4px] flex items-center justify-center shrink-0',
                          isIn ? 'bg-[#00FF66]/10 text-[#00FF66]' : 'bg-[#ff4d6d]/10 text-[#ff4d6d]'
                        )}
                      >
                        {isIn ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-white truncate">
                          {m.description || (isIn ? 'Aporte' : 'Retiro')}
                        </p>
                        <p className="text-[10px] text-[#8B92A9]">{formatDate(m.date, 'medium')}</p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'text-xs font-bold tabular-nums shrink-0',
                        isIn ? 'text-[#00FF66]' : 'text-[#ff4d6d]'
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
