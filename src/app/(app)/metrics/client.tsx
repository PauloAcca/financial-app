'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { MonthlyBarChart } from '@/components/metrics/monthly-bar-chart'
import { CategoryPieChart } from '@/components/metrics/category-pie-chart'
import { MetricsKpis } from '@/components/metrics/metrics-kpis'
import { TopCategories, type TopCategoryItem } from '@/components/metrics/top-categories'
import {
  CategoryComparison,
  type CategoryComparisonItem,
} from '@/components/metrics/category-comparison'
import { FixedVariableSplit } from '@/components/metrics/fixed-variable-split'

type MetricsMode = 'date' | 'applied'

export interface MetricTransaction {
  id: string
  amount: number
  type: string
  occurred_at: string
  applied_month: string | null
  category_id: string | null
  recurring_transaction_id: string | null
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

interface AggregatedCategory {
  name: string
  value: number
  fill: string
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

function sumAmounts(txs: MetricTransaction[]): number {
  return txs.reduce((total, tx) => total + Number(tx.amount), 0)
}

function aggregateByParent(
  txs: MetricTransaction[],
  categories: MetricCategory[]
): AggregatedCategory[] {
  const map: Record<string, { value: number; fill: string }> = {}
  txs.forEach((tx) => {
    const cat = categories.find((c) => c.id === tx.category_id)
    const parentCat = cat?.parent_id ? categories.find((c) => c.id === cat.parent_id) : cat
    const name = parentCat?.name || 'Sin categoría'
    const fill = parentCat?.color || '#94a3b8'
    if (!map[name]) map[name] = { value: 0, fill }
    map[name].value += Number(tx.amount)
  })
  return Object.entries(map)
    .map(([name, data]) => ({ name, value: data.value, fill: data.fill }))
    .sort((a, b) => b.value - a.value)
}

function aggregateByLeaf(
  txs: MetricTransaction[],
  categories: MetricCategory[]
): AggregatedCategory[] {
  const map: Record<string, { value: number; fill: string }> = {}
  txs.forEach((tx) => {
    const cat = categories.find((c) => c.id === tx.category_id)
    const name = cat?.name || 'Sin categoría'
    const fill = cat?.color || '#94a3b8'
    if (!map[name]) map[name] = { value: 0, fill }
    map[name].value += Number(tx.amount)
  })
  return Object.entries(map)
    .map(([name, data]) => ({ name, value: data.value, fill: data.fill }))
    .sort((a, b) => b.value - a.value)
}

interface PanelProps {
  title: string
  subtitle?: string
  className?: string
  children: React.ReactNode
}

function Panel({ title, subtitle, className, children }: PanelProps) {
  return (
    <div
      className={cn(
        'glass rounded-[var(--radius-xl)] p-4 shadow-[var(--shadow-md)]',
        className
      )}
    >
      <div className="mb-3">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">{title}</h2>
        {subtitle && (
          <p className="text-xs text-[var(--color-text-muted)] capitalize mt-1">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  )
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
  // Mes actual y anterior
  // =========================================================
  const currentMonthLabel = new Date(currentYear, currentMonthNum, 1).toLocaleString('es-AR', {
    month: 'long',
    year: 'numeric',
  })
  const previousMonthLabel = new Date(currentYear, currentMonthNum - 1, 1).toLocaleString('es-AR', {
    month: 'long',
    year: 'numeric',
  })

  const txInMonth = (tx: MetricTransaction, label: string) =>
    monthLabel(effectiveDate(tx, mode)) === label

  const currentExpenses = transactions.filter(
    (tx) => tx.type === 'expense' && txInMonth(tx, currentMonthLabel)
  )
  const previousExpenses = transactions.filter(
    (tx) => tx.type === 'expense' && txInMonth(tx, previousMonthLabel)
  )
  const currentIncomes = transactions.filter(
    (tx) => tx.type === 'income' && txInMonth(tx, currentMonthLabel)
  )

  // =========================================================
  // KPIs
  // =========================================================
  const totalIncome = sumAmounts(currentIncomes)
  const totalExpense = sumAmounts(currentExpenses)
  const balance = totalIncome - totalExpense
  const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0
  const previousTotalExpense = sumAmounts(previousExpenses)
  const expenseChangePct =
    previousTotalExpense > 0
      ? ((totalExpense - previousTotalExpense) / previousTotalExpense) * 100
      : null

  // =========================================================
  // Ranking y detalle por categoría
  // =========================================================
  const generalChartData = aggregateByParent(currentExpenses, categories)
  const detailedChartData = aggregateByLeaf(currentExpenses, categories)

  const topCategories: TopCategoryItem[] = generalChartData.slice(0, 6).map((cat) => ({
    ...cat,
    pct: totalExpense > 0 ? (cat.value / totalExpense) * 100 : 0,
  }))

  // =========================================================
  // Comparativa por categoría vs mes anterior
  // =========================================================
  const currentByParent = new Map(generalChartData.map((c) => [c.name, c]))
  const previousByParent = new Map(
    aggregateByParent(previousExpenses, categories).map((c) => [c.name, c])
  )
  const comparisonNames = new Set([...currentByParent.keys(), ...previousByParent.keys()])

  const categoryComparison: CategoryComparisonItem[] = Array.from(comparisonNames)
    .map((name) => {
      const current = currentByParent.get(name)?.value ?? 0
      const previous = previousByParent.get(name)?.value ?? 0
      const diff = current - previous
      const pct = previous > 0 ? (diff / previous) * 100 : null
      const fill =
        currentByParent.get(name)?.fill ?? previousByParent.get(name)?.fill ?? '#94a3b8'
      return { name, current, previous, diff, pct, fill }
    })
    .sort((a, b) => b.current - a.current)
    .slice(0, 8)

  // =========================================================
  // Fijos vs variables
  // =========================================================
  const fixedExpense = sumAmounts(
    currentExpenses.filter((tx) => tx.recurring_transaction_id)
  )
  const variableExpense = totalExpense - fixedExpense

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

      {/* Resumen del mes */}
      <MetricsKpis
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        balance={balance}
        savingsRate={savingsRate}
        expenseChangePct={expenseChangePct}
        currency={defaultCurrency}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Top categorías del mes" subtitle={`${currentMonthLabel} · en qué gastaste más`}>
          <TopCategories items={topCategories} currency={defaultCurrency} />
        </Panel>

        <Panel title="Comparativa vs mes anterior" subtitle={`${currentMonthLabel} vs ${previousMonthLabel}`}>
          <CategoryComparison items={categoryComparison} currency={defaultCurrency} />
        </Panel>
      </div>

      <Panel title="Gastos fijos vs variables" subtitle={currentMonthLabel}>
        <FixedVariableSplit fixed={fixedExpense} variable={variableExpense} currency={defaultCurrency} />
      </Panel>

      {/* Evolución Mensual */}
      <Panel title="Evolución de Ingresos y Gastos" subtitle={`Últimos 6 meses${mode === 'applied' ? ' · agrupado por mes aplicado' : ''}`}>
        <MonthlyBarChart data={barChartData} currency={defaultCurrency} />
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Gastos por Categoría General" subtitle={`${currentMonthLabel} (Agrupado)`}>
          <CategoryPieChart data={generalChartData} currency={defaultCurrency} />
        </Panel>

        <Panel title="Gastos Detallados (Subcategorías)" subtitle={`${currentMonthLabel} (Específico)`}>
          <CategoryPieChart data={detailedChartData} currency={defaultCurrency} />
        </Panel>
      </div>
    </div>
  )
}
