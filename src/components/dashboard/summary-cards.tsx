import { ArrowUpCircle, ArrowDownCircle, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { MonthSummary } from '@/types'

interface SummaryCardsProps {
  summary: MonthSummary
}

const CARDS = [
  {
    key: 'income' as const,
    label: 'Ingresos',
    icon: ArrowUpCircle,
    color: 'var(--color-income)',
    bgColor: 'var(--color-income-subtle)',
    getValue: (s: MonthSummary) => s.totalIncome,
  },
  {
    key: 'expense' as const,
    label: 'Gastos',
    icon: ArrowDownCircle,
    color: 'var(--color-expense)',
    bgColor: 'var(--color-expense-subtle)',
    getValue: (s: MonthSummary) => s.totalExpense,
  },
  {
    key: 'balance' as const,
    label: 'Balance',
    icon: TrendingUp,
    color: 'var(--color-accent)',
    bgColor: 'var(--color-accent-subtle)',
    getValue: (s: MonthSummary) => s.balance,
  },
]

export function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {CARDS.map(({ key, label, icon: Icon, color, bgColor, getValue }) => {
        const value = getValue(summary)
        const isBalance = key === 'balance'
        const balanceColor = isBalance
          ? value >= 0 ? 'var(--color-income)' : 'var(--color-expense)'
          : color

        return (
          <div
            key={key}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-sm)]"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                {label}
              </span>
              <div
                className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center"
                style={{ backgroundColor: bgColor }}
              >
                <Icon size={18} style={{ color }} />
              </div>
            </div>
            <p
              className="text-2xl font-bold tabular-nums"
              style={{ color: balanceColor }}
            >
              {formatCurrency(value, summary.currency)}
            </p>
          </div>
        )
      })}
    </div>
  )
}
