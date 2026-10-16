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
        'relative group glass rounded-[var(--radius-lg)] overflow-hidden',
        'transition-all duration-200 cursor-pointer select-none',
        'hover:bg-[rgba(255,255,255,0.07)] hover:border-[rgba(255,255,255,0.14)] hover:-translate-y-0.5 active:scale-[0.99]',
        account.archived && 'opacity-60'
      )}
    >
      {/* Acento de color */}
      <div className="h-0.5 w-full opacity-70" style={{ background: color }} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Icono */}
            <div
              className="w-10 h-10 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${color}20`, color }}
            >
              <IconComponent size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-[var(--color-text-primary)] leading-tight truncate">
                {account.name}
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{account.currency}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                onClick={handleEditClick}
                className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-secondary)]
                           hover:bg-[rgba(255,255,255,0.07)] hover:text-[var(--color-accent)]
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
              className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-secondary)]
                         hover:bg-[rgba(255,255,255,0.07)] hover:text-[var(--color-danger)]
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
          <p className="text-xs text-[var(--color-text-secondary)] mb-0.5">Saldo actual</p>
          <p
            className={cn(
              'text-2xl font-semibold tabular-nums tracking-tight',
              account.current_balance >= 0
                ? 'text-[var(--color-income)]'
                : 'text-[var(--color-expense)]'
            )}
          >
            {formatCurrency(account.current_balance, account.currency)}
          </p>
        </div>

        {/* Badges y botón de acción */}
        <div className="flex items-center justify-between pt-2 border-t border-[rgba(255,255,255,0.06)] mt-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="muted">{config.label}</Badge>
            {account.archived && <Badge variant="system">Archivada</Badge>}
          </div>

          <div className="flex items-center gap-1 text-xs font-medium text-[var(--color-text-secondary)] group-hover:text-[var(--color-accent)] transition-colors">
            <span>Ver movimientos</span>
            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  )
}
