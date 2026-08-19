'use client'

import { useState, useTransition } from 'react'
import { Trash2, Pencil, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, ReceiptText } from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { deleteTransaction } from '@/actions/transactions'
import { toast } from '@/components/ui/toast'
import { TransactionEditModal } from '@/components/transactions/transaction-edit-modal'
import type { Account, Category, Transaction, TransactionType } from '@/types/database'

const TYPE_ICON: Record<TransactionType, React.ReactNode> = {
  income:   <ArrowUpCircle  size={16} />,
  expense:  <ArrowDownCircle size={16} />,
  transfer: <ArrowLeftRight  size={16} />,
}

const TYPE_COLOR: Record<TransactionType, string> = {
  income:   'var(--color-income)',
  expense:  'var(--color-expense)',
  transfer: 'var(--color-transfer)',
}

const TYPE_SIGN: Record<TransactionType, string> = {
  income: '+', expense: '−', transfer: '',
}

interface TransactionListProps {
  transactions: Transaction[]
  accounts?: Account[]
  categories?: Category[]
}

interface TransactionRowProps {
  tx: Transaction
  onEdit: (tx: Transaction) => void
}

function TransactionRow({ tx, onEdit }: TransactionRowProps) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('¿Eliminás esta transacción? Se actualizará el saldo de la cuenta.')) return
    startTransition(async () => {
      const result = await deleteTransaction(tx.id)
      if (result.success) toast.success('Transacción eliminada.')
      else toast.error(result.error)
    })
  }

  const color = TYPE_COLOR[tx.type]

  return (
    <div className="group flex items-center gap-4 px-5 py-4 hover:bg-[var(--color-surface-2)] transition-colors rounded-[var(--radius-md)]">
      {/* Icono de tipo */}
      <div
        className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}1A`, color }}
      >
        {TYPE_ICON[tx.type]}
      </div>

      {/* Descripción + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">
            {tx.description || (tx.type === 'transfer' ? 'Transferencia' : 'Sin descripción')}
          </span>
          {tx.category && (
            <span
              className="hidden sm:inline-flex items-center text-xs px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: `${tx.category.color ?? '#6B7280'}20`,
                color: tx.category.color ?? '#6B7280',
              }}
            >
              {tx.category.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-[var(--color-text-muted)]">
            {formatDate(tx.occurred_at, 'medium')}
          </span>
          {tx.account && (
            <>
              <span className="text-[var(--color-text-muted)] text-xs">·</span>
              <span className="text-xs text-[var(--color-text-muted)] truncate max-w-[100px]">
                {tx.account.name}
                {tx.type === 'transfer' && tx.transfer_account && ` → ${tx.transfer_account.name}`}
              </span>
            </>
          )}
          {tx.payment_method && (
            <>
              <span className="text-[var(--color-text-muted)] text-xs">·</span>
              <span className="text-xs text-[var(--color-text-muted)]">{tx.payment_method}</span>
            </>
          )}
        </div>
      </div>

      {/* Monto y acciones */}
      <div className="flex items-center gap-3 shrink-0">
        <span
          className="text-sm font-bold tabular-nums"
          style={{ color }}
        >
          {TYPE_SIGN[tx.type]}{formatCurrency(tx.amount, tx.currency)}
        </span>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Botón editar */}
          <button
            onClick={() => onEdit(tx)}
            disabled={isPending}
            className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-text-muted)]
                       hover:bg-[var(--color-surface-3)] hover:text-[var(--color-text-primary)]
                       cursor-pointer disabled:opacity-40"
            aria-label="Editar transacción"
            title="Editar"
          >
            <Pencil size={14} />
          </button>

          {/* Botón eliminar */}
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-text-muted)]
                       hover:bg-[var(--color-danger-subtle)] hover:text-[var(--color-danger)]
                       cursor-pointer disabled:opacity-40"
            aria-label="Eliminar transacción"
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

// Agrupar transacciones por fecha
function groupByDate(transactions: Transaction[]): Map<string, Transaction[]> {
  const groups = new Map<string, Transaction[]>()
  for (const tx of transactions) {
    const existing = groups.get(tx.occurred_at) ?? []
    groups.set(tx.occurred_at, [...existing, tx])
  }
  return groups
}

export function TransactionList({ transactions, accounts = [], categories = [] }: TransactionListProps) {
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-14 h-14 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center">
          <ReceiptText size={26} className="text-[var(--color-text-muted)]" />
        </div>
        <p className="text-sm text-[var(--color-text-muted)]">No hay transacciones todavía.</p>
      </div>
    )
  }

  const groups = groupByDate(transactions)

  return (
    <>
      <div className="flex flex-col gap-1">
        {Array.from(groups.entries()).map(([date, txs]) => (
          <div key={date}>
            {/* Cabecera de fecha */}
            <div className="flex items-center gap-3 px-1 py-2 sticky top-0 bg-[var(--color-background)] z-10">
              <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                {formatDate(date, 'long')}
              </span>
              <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
              <span className="text-xs text-[var(--color-text-muted)] tabular-nums">
                {txs.length} mov.
              </span>
            </div>

            {/* Filas */}
            {txs.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} onEdit={(t) => setEditingTx(t)} />
            ))}
          </div>
        ))}
      </div>

      <TransactionEditModal
        open={!!editingTx}
        onClose={() => setEditingTx(null)}
        transaction={editingTx}
        accounts={accounts}
        categories={categories}
      />
    </>
  )
}
