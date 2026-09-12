import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { MetricsClient, type MetricTransaction, type MetricCategory } from './client'

export const metadata: Metadata = { title: 'Métricas' }

export const dynamic = 'force-dynamic'

export default async function MetricsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user!.id

  // Rango de fechas: últimos 6 meses (incluyendo el actual)
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const startStr = startDate.toISOString().split('T')[0]

  const [{ data: transactions }, { data: allCategories }, { data: profile }] = await Promise.all([
    supabase
      .from('transactions')
      .select('id, amount, type, occurred_at, applied_month, category_id')
      .eq('user_id', uid)
      .or(`occurred_at.gte.${startStr},applied_month.gte.${startStr}`)
      .order('occurred_at', { ascending: true }),
    supabase
      .from('categories')
      .select('id, name, color, parent_id')
      .or(`user_id.eq.${uid},is_system.eq.true`),
    supabase
      .from('profiles')
      .select('default_currency')
      .eq('id', uid)
      .single(),
  ])

  const defaultCurrency = profile?.default_currency ?? 'ARS'

  return (
    <MetricsClient
      transactions={(transactions ?? []) as MetricTransaction[]}
      categories={(allCategories ?? []) as MetricCategory[]}
      defaultCurrency={defaultCurrency}
    />
  )
}
