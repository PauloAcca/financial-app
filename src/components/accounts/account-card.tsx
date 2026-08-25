'use client'

import { useState, useTransition } from 'react'
import {
  Building2, Wallet, Banknote, CreditCard, TrendingUp, Circle,
  Archive, ArchiveRestore, Pencil, ChevronRight,
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { toggleArchiveAccount } from '@/actions/accounts'
import { toast } from '@/components/ui/toast'
import { Badge } from '@/components/ui/badge'
import { ACCOUNT_TYPE_CONFIG } from '@/lib/constants'
import type { Account } from '@/types/database'

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  'building-2': Building2,
  'wallet': Wallet,
  'banknote': Banknote,
  'credit-card': CreditCard,
  'trending-up': TrendingUp,
  'circle': Circle,
}

interface AccountCardProps {
  account: Account
  onEdit?: (account: Account) => void
  onSelect?: (account: Account) => void
}

export function AccountCard({ account, onEdit, onSelect }: AccountCardProps) {
  const [isPending, startTransition] = useTransition()
  const config = ACCOUNT_TYPE_CONFIG[account.type]
  const IconComponent = ICON_MAP[account.icon ?? config.icon] ?? Circle
  const color = account.color ?? config.defaultColor

  function handleArchiveToggle(e: React.MouseEvent) {
    e.stopPropagation()
    startTransition(async () => {
      const result = await toggleArchiveAccount(account.id, !account.archived)
      if (result.success) {
        toast.success(account.archived ? 'Cuenta restaurada.' : 'Cuenta archivada.')
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleEditClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (onEdit) onEdit(account)
  }

  return (
    <div
      onClick={() => onSelect?.(account)}
      className={cn(
        'relative group bg-[#181c31] rounded-[6px]',
        'border border-[#293056] shadow-[var(--shadow-sm)]',
        'transition-all duration-200 cursor-pointer select-none',
        'hover:border-[#00FF66] hover:shadow-[0_0_15px_rgba(0,255,102,0.2)] hover:translate-y-[-2px] active:scale-[0.99]',
        account.archived && 'opacity-60'
      )}
    >
      {/* Barra de color superior */}
      <div
        className="h-1 rounded-t-[5px] w-full transition-all group-hover:h-1.5"
        style={{ background: color }}
      />

      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Icono */}
            <div
              className="w-10 h-10 rounded-[4px] flex items-center justify-center shrink-0 border border-transparent group-hover:border-[#00FF66]/50 transition-colors"
              style={{ backgroundColor: `${color}20`, color }}
            >
              <IconComponent size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white leading-tight font-mono tracking-wide truncate group-hover:text-[#00FF66] transition-colors">
                {account.name}
              </h3>
              <p className="text-xs text-[#8B92A9] font-mono mt-0.5">{account.currency}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                onClick={handleEditClick}
                className="p-1.5 rounded-[4px] text-[#8B92A9]
                           hover:bg-[#20253f] hover:text-[#00FF66]
                           transition-colors cursor-pointer"
                aria-label={`Editar ${account.name}`}
                title="Editar cuenta"
              >
                <Pencil size={15} />
              </button>
            )}
            <button
              onClick={handleArchiveToggle}
              disabled={isPending}
              className="p-1.5 rounded-[4px] text-[#8B92A9]
                         hover:bg-[#20253f] hover:text-[#ff4d6d]
                         transition-colors cursor-pointer disabled:opacity-40"
              aria-label={account.archived ? 'Restaurar cuenta' : 'Archivar cuenta'}
              title={account.archived ? 'Restaurar cuenta' : 'Archivar cuenta'}
            >
              {account.archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
            </button>
          </div>
        </div>

        {/* Saldo */}
        <div className="mb-3">
          <p className="text-[11px] text-[#8B92A9] font-mono uppercase tracking-wider mb-0.5">Saldo actual</p>
          <p
            className={cn(
              'text-2xl font-bold font-mono tabular-nums tracking-tight',
              account.current_balance >= 0
                ? 'text-[#00FF66] glow-text-green'
                : 'text-[#ff4d6d] glow-text-pink'
            )}
          >
            {formatCurrency(account.current_balance, account.currency)}
          </p>
        </div>

        {/* Badges y botón de acción */}
        <div className="flex items-center justify-between pt-2 border-t border-[#232845] mt-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[2px] bg-[#14182b] border border-[#293056] text-[#8B92A9] uppercase">
              {config.label}
            </span>
            {account.archived && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[2px] bg-[#293056] text-[#8B92A9] uppercase">
                Archivada
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs font-mono font-bold text-[#8B92A9] group-hover:text-[#00FF66] transition-colors">
            <span>VER MOVIMIENTOS</span>
            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  )
}
