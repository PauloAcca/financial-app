'use client'

import { TrendingUp, TrendingDown, Calendar, ArrowDownLeft, ArrowUpRight, Pencil } from 'lucide-react'
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
        'group bg-[#181c31] border rounded-[6px] p-4 font-mono transition-all duration-200 cursor-pointer select-none relative shadow-sm',
        'hover:shadow-[0_0_15px_rgba(168,85,247,0.18)] hover:translate-y-[-2px] active:scale-[0.99]',
        isUp ? 'border-[#00FF66]/40 hover:border-[#00FF66]' : 'border-[#ff4d6d]/40 hover:border-[#ff4d6d]'
      )}
    >
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-10 h-10 rounded-[4px] flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: `${account.color ?? config.defaultColor}20`,
              borderColor: `${account.color ?? config.defaultColor}55`,
              color: account.color ?? config.defaultColor,
            }}
          >
            <TrendingUp size={20} className="stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-white text-sm sm:text-base tracking-wide truncate group-hover:text-[#00FF66] transition-colors">
              {account.name}
            </h3>
            <span className="text-[10px] font-bold tracking-wider uppercase text-[#a855f7]">
              {config.label} · {account.currency}
            </span>
          </div>
        </div>

        <button
          onClick={(e) => {
            stop(e)
            onUpdateValue(platform)
          }}
          className="p-1.5 rounded bg-[#20253f] text-[#5d6786] hover:text-[#00FF66] hover:bg-[#00FF66]/15 transition-colors shrink-0"
          title="Actualizar valor"
        >
          <Pencil size={14} />
        </button>
      </div>

      {/* Números */}
      <div className="bg-[#14182b] border border-[#293056] rounded-[4px] p-3 mb-3">
        <p className="text-[10px] text-[#8B92A9] uppercase tracking-wider">VALOR ACTUAL</p>
        <p className="text-lg sm:text-xl font-bold text-white tabular-nums tracking-tight">
          {hidden ? '••••••' : formatCurrency(currentValue, account.currency)}
        </p>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#20253f]">
          <div>
            <p className="text-[10px] text-[#5d6786] uppercase">APORTADO</p>
            <p className="text-xs font-bold text-[#8B92A9] tabular-nums">
              {hidden ? '••••' : formatCurrency(capital, account.currency)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#5d6786] uppercase">GANANCIA / PÉRDIDA</p>
            <p
              className={cn(
                'text-xs font-bold tabular-nums flex items-center gap-1 justify-end',
                isUp ? 'text-[#00FF66]' : 'text-[#ff4d6d]'
              )}
            >
              {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>
                {hidden
                  ? '••••'
                  : `${isUp ? '+' : ''}${formatCurrency(gain, account.currency)}`}
                {gainPct !== null && !hidden && (
                  <span className="ml-1">({isUp ? '+' : ''}{gainPct.toFixed(2)}%)</span>
                )}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs pt-1">
        <div className="flex items-center gap-1.5 text-[#8B92A9] text-[11px]">
          <Calendar size={13} className="text-[#5d6786]" />
          <span>
            {lastValuedAt
              ? `Valorado: ${formatDate(lastValuedAt, 'short')}`
              : hasValuation
              ? 'Valorado'
              : `Desde: ${formatDate(since, 'short')}`}
          </span>
        </div>

        <div className="flex items-center gap-1.5" onClick={stop}>
          <button
            onClick={() => onContribute(platform)}
            className="px-2.5 py-1 rounded-[4px] text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95 border bg-[#181c31] text-[#00FF66] border-[#00FF66]/40 hover:bg-[#00FF66]/10 flex items-center gap-1"
            title="Registrar aporte o retiro"
          >
            <ArrowDownLeft size={12} className="stroke-[3]" />
            <span>Aportar</span>
          </button>
        </div>
      </div>

      {!hasValuation && (
        <button
          onClick={(e) => {
            stop(e)
            onUpdateValue(platform)
          }}
          className="mt-3 w-full py-1.5 rounded-[4px] bg-[#a855f7]/10 border border-[#a855f7]/40 text-[#a855f7] text-[11px] font-bold uppercase tracking-wider hover:bg-[#a855f7]/20 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <ArrowUpRight size={12} />
          <span>Cargar valor actual para ver la ganancia</span>
        </button>
      )}
    </div>
  )
}
