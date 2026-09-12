'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { MonthlyBarChart } from '@/components/metrics/monthly-bar-chart'
import { CategoryPieChart } from '@/components/metrics/category-pie-chart'

type MetricsMode = 'date' | 'applied'

export interface MetricTransaction {
  id: string
  amount: number
  type: string
  occurred_at: string
  applied_month: string | null
  category_id: string | null
}

export interface MetricCategory {
  id: string
  name: string
  color: string | null
  parent_id: string | null
}

interface MetricsClientProps {
  transactions: MetricTransaction[]
  categories: MetricCategory[]
  defaultCurrency: string
}

function monthLabel(isoDate: string): string {
  return new Date(isoDate + 'T00:00:00').toLocaleString('es-AR', {
    month: 'long',
    year: 'numeric',
  })
}

function effectiveDate(tx: MetricTransaction, mode: MetricsMode): string {
  if (mode === 'applied' && tx.applied_month) return tx.applied_month
  return tx.occurred_at
}

export function MetricsClient({ transactions, categories, defaultCurrency }: MetricsClientProps) {
  const [mode, setMode] = useState<MetricsMode>('date')

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonthNum = now.getMonth()

  // Etiquetas de los últimos 6 meses (incluyendo el actual)
  const months: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonthNum - i, 1)
    months.push(d.toLocaleString('es-AR', { month: 'long', year: 'numeric' }))
  }

  // =========================================================
  // Barras: últimos 6 meses
  // =========================================================
  const monthlyMap: Record<string, { income: number; expense: number }> = {}
  months.forEach((m) => {
    monthlyMap[m] = { income: 0, expense: 0 }
  })

  transactions.forEach((tx) => {
    const label = monthLabel(effectiveDate(tx, mode))
    if (!monthlyMap[label]) return
    if (tx.type === 'income') monthlyMap[label].income += Number(tx.amount)
    else if (tx.type === 'expense') monthlyMap[label].expense += Number(tx.amount)
  })

  const barChartData = months.map((month) => ({
    month,
    income: monthlyMap[month].income,
    expense: monthlyMap[month].expense,
  }))

  // =========================================================
  // Torta: gastos del mes actual
  // =========================================================
  const currentMonthLabel = new Date(currentYear, currentMonthNum, 1).toLocaleString('es-AR', {
    month: 'long',
    year: 'numeric',
  })

  const generalMap: Record<string, { value: number; fill: string }> = {}
  const detailedMap: Record<string, { value: number; fill: string }> = {}

  transactions
    .filter(
      (tx) => tx.type === 'expense' && monthLabel(effectiveDate(tx, mode)) === currentMonthLabel
    )
    .forEach((tx) => {
      const cat = categories.find((c) => c.id === tx.category_id)
      const parentCat = cat?.parent_id ? categories.find((c) => c.id === cat.parent_id) : cat

      const gName = parentCat?.name || 'Sin categoría'
      const gColor = parentCat?.color || '#94a3b8'
      if (!generalMap[gName]) generalMap[gName] = { value: 0, fill: gColor }
      generalMap[gName].value += Number(tx.amount)

      const dName = cat?.name || 'Sin categoría'
      const dColor = cat?.color || '#94a3b8'
      if (!detailedMap[dName]) detailedMap[dName] = { value: 0, fill: dColor }
      detailedMap[dName].value += Number(tx.amount)
    })

  const generalChartData = Object.entries(generalMap)
    .map(([name, data]) => ({ name, value: data.value, fill: data.fill }))
    .sort((a, b) => b.value - a.value)

  const detailedChartData = Object.entries(detailedMap)
    .map(([name, data]) => ({ name, value: data.value, fill: data.fill }))
    .sort((a, b) => b.value - a.value)

  return (
    <div className="flex flex-col gap-5 pb-10 font-mono">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide uppercase">MÉTRICAS</h1>
        <p className="text-sm text-[#8B92A9] mt-0.5">
          Análisis de tus finanzas en los últimos 6 meses.
        </p>
      </div>

      {/* Selector de modo de agrupación */}
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2 max-w-sm">
          <button
            onClick={() => setMode('date')}
            className={cn(
              'py-2 px-3 rounded-[4px] text-[11px] font-bold tracking-wider uppercase transition-all cursor-pointer text-center active:scale-95',
              mode === 'date'
                ? 'bg-[#00FF66] text-black shadow-[0_0_10px_rgba(0,255,102,0.4)]'
                : 'bg-[#1e233d] text-[#8B92A9] border border-[#293056] hover:text-white hover:bg-[#252b49]'
            )}
          >
            Por fecha
          </button>
          <button
            onClick={() => setMode('applied')}
            className={cn(
              'py-2 px-3 rounded-[4px] text-[11px] font-bold tracking-wider uppercase transition-all cursor-pointer text-center active:scale-95',
              mode === 'applied'
                ? 'bg-[#00FF66] text-black shadow-[0_0_10px_rgba(0,255,102,0.4)]'
                : 'bg-[#1e233d] text-[#8B92A9] border border-[#293056] hover:text-white hover:bg-[#252b49]'
            )}
          >
            Por mes aplicado
          </button>
        </div>
        <p className="text-[11px] text-[#5d6786]">
          {mode === 'applied'
            ? 'Los movimientos con “mes aplicado” se agrupan según el mes en que usás esa plata (ej: sueldo de agosto aplicado a septiembre).'
            : 'Los movimientos se agrupan por su fecha real.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Evolución Mensual */}
        <div className="glass rounded-[var(--radius-xl)] p-4 shadow-[var(--shadow-md)] lg:col-span-2">
          <div className="mb-3">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              Evolución de Ingresos y Gastos
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Últimos 6 meses {mode === 'applied' && '· agrupado por mes aplicado'}
            </p>
          </div>
          <MonthlyBarChart data={barChartData} currency={defaultCurrency} />
        </div>

        {/* Gastos por Categoría General */}
        <div className="glass rounded-[var(--radius-xl)] p-4 shadow-[var(--shadow-md)]">
          <div className="mb-3">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              Gastos por Categoría General
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] capitalize mt-1">
              {currentMonthLabel} (Agrupado)
            </p>
          </div>
          <CategoryPieChart data={generalChartData} currency={defaultCurrency} />
        </div>

        {/* Gastos Detallados */}
        <div className="glass rounded-[var(--radius-xl)] p-4 shadow-[var(--shadow-md)]">
          <div className="mb-3">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              Gastos Detallados (Subcategorías)
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] capitalize mt-1">
              {currentMonthLabel} (Específico)
            </p>
          </div>
          <CategoryPieChart data={detailedChartData} currency={defaultCurrency} />
        </div>
      </div>
    </div>
  )
}
