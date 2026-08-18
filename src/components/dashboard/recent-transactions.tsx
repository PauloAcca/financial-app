import Link from 'next/link'
import { ArrowRight, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight } from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import type { Transaction, TransactionType } from '@/types/database'

const TYPE_ICON: Record<TransactionType, React.ReactNode> = {
  income:   <ArrowUpCircle  size={15} />,
  expense:  <ArrowDownCircle size={15} />,
  transfer: <ArrowLeftRight  size={15} />,
}

const TYPE_COLOR: Record<TransactionType, string> = {
  income:   'var(--color-income)',
  expense:  'var(--color-expense)',
  transfer: 'var(--color-transfer)',
}

const TYPE_SIGN: Record<TransactionType, string> = {
  income: '+', expense: '−', transfer: '',
}

interface RecentTransactionsProps {
  transactions: Transaction[]
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
        <h2 className="font-semibold text-[var(--color-text-primary)]">Últimos movimientos</h2>
        <Link
          href="/transactions"
          className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1"
        >
          Ver todos
          <ArrowRight size={12} />
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">
            No hay movimientos este mes.{' '}
            <Link href="/transactions" className="text-[var(--color-accent)] hover:underline">
              Cargá el primero.
            </Link>
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--color-border-subtle)]">
          {transactions.map((tx) => {
            const color = TYPE_COLOR[tx.type]
            return (
              <div
                key={tx.id}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <div
                  className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${color}1A`, color }}
                >
                  {TYPE_ICON[tx.type]}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                    {tx.description || (tx.type === 'transfer' ? 'Transferencia' : 'Sin descripción')}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {formatDate(tx.occurred_at, 'medium')}
                    {tx.category && ` · ${tx.category.name}`}
                  </p>
                </div>

                <span
                  className="text-sm font-bold tabular-nums shrink-0"
                  style={{ color }}
                >
                  {TYPE_SIGN[tx.type]}{formatCurrency(tx.amount, tx.currency)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
