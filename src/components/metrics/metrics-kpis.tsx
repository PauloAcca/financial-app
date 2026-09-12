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
  glow?: boolean
}

function KpiCard({ label, value, accent, hint, glow }: KpiCardProps) {
  return (
    <div
      className={cn(
        'bg-[#181c31] border border-[#293056] rounded-[4px] p-3.5 flex flex-col gap-1.5',
        glow && 'shadow-[0_0_10px_rgba(0,255,102,0.15)]'
      )}
    >
      <span className="text-[10px] font-bold tracking-widest uppercase text-[#8B92A9]">
        {label}
      </span>
      <span className={cn('text-lg sm:text-xl font-bold tabular-nums truncate', accent)}>
        {value}
      </span>
      {hint && <span className="text-[10px] font-mono leading-tight">{hint}</span>}
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
        accent="text-[#00FF66] glow-text-green"
      />

      <KpiCard
        label="Gastos del mes"
        value={formatCurrency(totalExpense, currency)}
        accent="text-[#ff4d6d]"
        hint={
          expenseChangePct === null ? (
            <span className="text-[#5d6786]">Sin datos del mes anterior</span>
          ) : (
            <span
              className={cn(
                'inline-flex items-center gap-0.5',
                expenseUp ? 'text-[#ff4d6d]' : 'text-[#00FF66]'
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
        accent={balance >= 0 ? 'text-[#38d9f5] glow-text-cyan' : 'text-[#ff4d6d]'}
        hint={
          <span className="text-[#5d6786]">
            {balance >= 0 ? 'Te sobró este mes' : 'Gastaste más de lo que ingresó'}
          </span>
        }
      />

      <KpiCard
        label="Tasa de ahorro"
        value={`${savingsRate.toFixed(1)}%`}
        accent={savingsRate >= 0 ? 'text-[#00FF66] glow-text-green' : 'text-[#ff4d6d]'}
        hint={
          <span className="text-[#5d6786]">
            {totalIncome > 0 ? 'Ingresos menos gastos' : 'Sin ingresos registrados'}
          </span>
        }
      />
    </div>
  )
}
