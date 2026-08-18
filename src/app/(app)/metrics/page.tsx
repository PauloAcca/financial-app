import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { MonthlyBarChart } from '@/components/metrics/monthly-bar-chart'
import { CategoryPieChart } from '@/components/metrics/category-pie-chart'

export const metadata: Metadata = { title: 'Métricas' }

export default async function MetricsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user!.id

  // Rango de fechas: últimos 6 meses (incluyendo el actual)
  const now = new Date()
  const currentMonthNum = now.getMonth()
  const currentYear = now.getFullYear()
  
  // start of month 5 meses atrás
  const startDate = new Date(currentYear, currentMonthNum - 5, 1)
  const startStr = startDate.toISOString().split('T')[0]

  // Cargar transacciones
  const { data: transactions } = await supabase
    .from('transactions')
    .select(`
      id, amount, type, occurred_at, category_id,
      category:categories(name, color)
    `)
    .eq('user_id', uid)
    .gte('occurred_at', startStr)
    .order('occurred_at', { ascending: true })

  const { data: profile } = await supabase
    .from('profiles')
    .select('default_currency')
    .eq('id', uid)
    .single()

  const defaultCurrency = profile?.default_currency ?? 'ARS'

  // =========================================================
  // Procesar Datos para Gráfico de Barras (Últimos 6 meses)
  // =========================================================
  // Inicializar arreglo con los últimos 6 meses en orden
  const monthlyData: Record<string, { income: number; expense: number }> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonthNum - i, 1)
    const label = d.toLocaleString('es-AR', { month: 'long', year: 'numeric' })
    monthlyData[label] = { income: 0, expense: 0 }
  }

  // Acumular transacciones
  transactions?.forEach((tx) => {
    const d = new Date(tx.occurred_at + 'T00:00:00')
    const label = d.toLocaleString('es-AR', { month: 'long', year: 'numeric' })
    if (monthlyData[label]) {
      if (tx.type === 'income') monthlyData[label].income += Number(tx.amount)
      else if (tx.type === 'expense') monthlyData[label].expense += Number(tx.amount)
    }
  })

  const barChartData = Object.entries(monthlyData).map(([month, data]) => ({
    month,
    income: data.income,
    expense: data.expense,
  }))

  // =========================================================
  // Procesar Datos para Gráfico de Torta (Gastos Mes Actual)
  // =========================================================
  const currentMonthLabel = new Date(currentYear, currentMonthNum, 1).toLocaleString('es-AR', { month: 'long', year: 'numeric' })
  
  const currentMonthExpenses = transactions?.filter(tx => {
    const d = new Date(tx.occurred_at + 'T00:00:00')
    const label = d.toLocaleString('es-AR', { month: 'long', year: 'numeric' })
    return label === currentMonthLabel && tx.type === 'expense'
  }) || []

  const categoryMap: Record<string, { value: number; fill: string }> = {}
  currentMonthExpenses.forEach((tx) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cat = tx.category as any
    const catName = cat?.name || 'Sin categoría'
    const catColor = cat?.color || '#94a3b8'

    if (!categoryMap[catName]) {
      categoryMap[catName] = { value: 0, fill: catColor }
    }
    categoryMap[catName].value += Number(tx.amount)
  })

  const pieChartData = Object.entries(categoryMap)
    .map(([name, data]) => ({
      name,
      value: data.value,
      fill: data.fill,
    }))
    .sort((a, b) => b.value - a.value) // Ordenar de mayor a menor

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Métricas</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
          Análisis de tus finanzas en los últimos 6 meses.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gastos por Categoría */}
        <div className="glass rounded-[var(--radius-xl)] p-6 shadow-[var(--shadow-md)]">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              Gastos por Categoría
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] capitalize mt-1">
              {currentMonthLabel}
            </p>
          </div>
          <CategoryPieChart data={pieChartData} currency={defaultCurrency} />
        </div>

        {/* Evolución Mensual */}
        <div className="glass rounded-[var(--radius-xl)] p-6 shadow-[var(--shadow-md)]">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              Evolución de Ingresos y Gastos
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Últimos 6 meses
            </p>
          </div>
          <MonthlyBarChart data={barChartData} currency={defaultCurrency} />
        </div>
      </div>
    </div>
  )
}
