'use client'

import { useState, useTransition } from 'react'
import {
  Building2, Wallet, Banknote, CreditCard, TrendingUp, Circle,
  Archive, ArchiveRestore, Pencil,
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
}

export function AccountCard({ account, onEdit }: AccountCardProps) {
  const [isPending, startTransition] = useTransition()
  const config = ACCOUNT_TYPE_CONFIG[account.type]
  const IconComponent = ICON_MAP[account.icon ?? config.icon] ?? Circle
  const color = account.color ?? config.defaultColor

  function handleArchiveToggle() {
    startTransition(async () => {
      const result = await toggleArchiveAccount(account.id, !account.archived)
      if (result.success) {
        toast.success(account.archived ? 'Cuenta restaurada.' : 'Cuenta archivada.')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div
      className={cn(
        'relative group bg-[var(--color-surface)] rounded-[var(--radius-lg)]',
        'border border-[var(--color-border)] shadow-[var(--shadow-sm)]',
        'transition-all duration-200',
        'hover:border-[var(--color-border)] hover:shadow-[var(--shadow-md)]',
        account.archived && 'opacity-60'
      )}
    >
      {/* Barra de color superior */}
      <div
        className="h-1 rounded-t-[var(--radius-lg)] w-full"
        style={{ background: color }}
      />

      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Icono */}
            <div
              className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${color}1A`, color }}
            >
              <IconComponent size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--color-text-primary)] leading-tight">
                {account.name}
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{account.currency}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                onClick={() => onEdit(account)}
                className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-text-muted)]
                           hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]
                           transition-colors cursor-pointer"
                aria-label={`Editar ${account.name}`}
              >
                <Pencil size={15} />
              </button>
            )}
            <button
              onClick={handleArchiveToggle}
              disabled={isPending}
              className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-text-muted)]
                         hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]
                         transition-colors cursor-pointer disabled:opacity-40"
              aria-label={account.archived ? 'Restaurar cuenta' : 'Archivar cuenta'}
            >
              {account.archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
            </button>
          </div>
        </div>

        {/* Saldo */}
        <div>
          <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Saldo actual</p>
          <p
            className={cn(
              'text-2xl font-bold tabular-nums',
              account.current_balance >= 0
                ? 'text-[var(--color-text-primary)]'
                : 'text-[var(--color-danger)]'
            )}
          >
            {formatCurrency(account.current_balance, account.currency)}
          </p>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 mt-3">
          <Badge variant="muted">{config.label}</Badge>
          {account.archived && <Badge variant="system">Archivada</Badge>}
        </div>
      </div>
    </div>
  )
}
