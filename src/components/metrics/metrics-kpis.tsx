'use client'

import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'

interface MetricsKpisProps {
  totalIncome: number
  totalExpense: number
  balance: number
  savingsRate: number
  expenseChangePct: number | null
  currency: string
}

interface KpiCardProps {
  label: string
  value: string
  accent: string
  hint?: React.ReactNode
}

function KpiCard({ label, value, accent, hint }: KpiCardProps) {
  return (
    <div className="glass rounded-[var(--radius-lg)] p-4 flex flex-col gap-1.5">
      <span className="text-xs font-medium text-[var(--color-text-secondary)]">
        {label}
      </span>
      <span className={cn('text-xl font-semibold tabular-nums truncate', accent)}>
        {value}
      </span>
      {hint && (
        <span className="text-[0.6875rem] leading-tight text-[var(--color-text-muted)]">
          {hint}
        </span>
      )}
    </div>
  )
}

export function MetricsKpis({
  totalIncome,
  totalExpense,
  balance,
  savingsRate,
  expenseChangePct,
  currency,
}: MetricsKpisProps) {
  const expenseUp = expenseChangePct !== null && expenseChangePct > 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KpiCard
        label="Ingresos del mes"
        value={formatCurrency(totalIncome, currency)}
        accent="text-[var(--color-income)]"
      />

      <KpiCard
        label="Gastos del mes"
        value={formatCurrency(totalExpense, currency)}
        accent="text-[var(--color-expense)]"
        hint={
          expenseChangePct === null ? (
            <span>Sin datos del mes anterior</span>
          ) : (
            <span
              className={cn(
                'inline-flex items-center gap-0.5',
                expenseUp ? 'text-[var(--color-expense)]' : 'text-[var(--color-income)]'
              )}
            >
              {expenseUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
              {Math.abs(expenseChangePct).toFixed(1)}% vs mes anterior
            </span>
          )
        }
      />

      <KpiCard
        label="Ahorro del mes"
        value={formatCurrency(balance, currency)}
        accent={balance >= 0 ? 'text-[var(--color-info)]' : 'text-[var(--color-expense)]'}
        hint={
          <span>
            {balance >= 0 ? 'Te sobró este mes' : 'Gastaste más de lo que ingresó'}
          </span>
        }
      />

      <KpiCard
        label="Tasa de ahorro"
        value={`${savingsRate.toFixed(1)}%`}
        accent={savingsRate >= 0 ? 'text-[var(--color-income)]' : 'text-[var(--color-expense)]'}
        hint={
          <span>
            {totalIncome > 0 ? 'Ingresos menos gastos' : 'Sin ingresos registrados'}
          </span>
        }
      />
    </div>
  )
}
