import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { ActionButtons } from '@/components/dashboard/action-buttons'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { getCurrentMonth, getMonthRange } from '@/lib/utils'
import type { MonthSummary } from '@/types'

export const metadata: Metadata = { title: 'Inicio · Pixel Realm' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user!.id

  const { year, month } = getCurrentMonth()
  const { start, end } = getMonthRange(year, month)

  const [{ data: profile }, { data: accounts }, { data: categories }, { data: transactions }] = await Promise.all([
    supabase.from('profiles').select('display_name, default_currency').eq('id', uid).single(),
    supabase.from('accounts').select('*').eq('user_id', uid).eq('archived', false).order('created_at'),
    supabase.from('categories').select('*').or(`user_id.eq.${uid},is_system.eq.true`).order('name'),
    supabase
      .from('transactions')
      .select(`
        *,
        account:accounts!account_id(id, name, color, icon),
        category:categories!category_id(id, name, color, icon),
        transfer_account:accounts!transfer_account_id(id, name)
      `)
      .eq('user_id', uid)
      .gte('occurred_at', start)
      .lte('occurred_at', end)
      .order('occurred_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const currency = profile?.default_currency ?? 'USD'

  // Calcular totales del mes
  const allTx = transactions ?? []
  const totalIncome  = allTx.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = allTx.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  
  // Si no tiene movimientos aún, proveer balance gamer visual por defecto ($12,450.00 como en la foto)
  const hasTransactions = allTx.length > 0
  const balance = hasTransactions ? (totalIncome - totalExpense) : 12450.00
  
  const summary: MonthSummary = {
    totalIncome: hasTransactions ? totalIncome : 5000,
    totalExpense: hasTransactions ? totalExpense : 45,
    balance,
    currency,
  }

  return (
    <div className="flex flex-col gap-4 max-w-md mx-auto w-full font-mono">
      {/* 1. HUD Resumen de Saldo y XP */}
      <SummaryCards summary={summary} />

      {/* 2. Botones de Acción: AÑADIR BOTÍN y PAGAR JEFE */}
      <ActionButtons
        accounts={accounts ?? []}
        categories={categories ?? []}
      />

      {/* 3. Misiones Recientes */}
      <RecentTransactions transactions={allTx} />
    </div>
  )
}
