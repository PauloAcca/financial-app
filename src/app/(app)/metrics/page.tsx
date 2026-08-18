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
    .select('id, amount, type, occurred_at, category_id')
    .eq('user_id', uid)
    .gte('occurred_at', startStr)
    .order('occurred_at', { ascending: true })

  // Cargar categorías para poder cruzar padres e hijos
  const { data: allCategories } = await supabase
    .from('categories')
    .select('id, name, color, parent_id')
    .or(`user_id.eq.${uid},is_system.eq.true`)

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

  const generalMap: Record<string, { value: number; fill: string }> = {}
  const detailedMap: Record<string, { value: number; fill: string }> = {}

  currentMonthExpenses.forEach((tx) => {
    const cat = allCategories?.find(c => c.id === tx.category_id)
    const parentCat = cat?.parent_id ? allCategories?.find(c => c.id === cat.parent_id) : cat

    // General (Agrupado por Padre)
    const gName = parentCat?.name || 'Sin categoría'
    const gColor = parentCat?.color || '#94a3b8'
    if (!generalMap[gName]) generalMap[gName] = { value: 0, fill: gColor }
    generalMap[gName].value += Number(tx.amount)

    // Detallado (Subcategorías específicas)
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
    <div className="flex flex-col gap-8 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Métricas</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
          Análisis de tus finanzas en los últimos 6 meses.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolución Mensual */}
        <div className="glass rounded-[var(--radius-xl)] p-6 shadow-[var(--shadow-md)] lg:col-span-2">
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

        {/* Gastos por Categoría General */}
        <div className="glass rounded-[var(--radius-xl)] p-6 shadow-[var(--shadow-md)]">
          <div className="mb-6">
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
        <div className="glass rounded-[var(--radius-xl)] p-6 shadow-[var(--shadow-md)]">
          <div className="mb-6">
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
