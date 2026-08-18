import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus, Wallet } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { AccountCard } from '@/components/accounts/account-card'
import { InsightsBanner } from '@/components/dashboard/insights-banner'
import { getCurrentMonth, getMonthRange, formatCurrency } from '@/lib/utils'
import type { MonthSummary } from '@/types'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user!.id

  const { year, month } = getCurrentMonth()
  const { start, end } = getMonthRange(year, month)

  const [{ data: profile }, { data: accounts }, { data: transactions }, { data: insights }] = await Promise.all([
    supabase.from('profiles').select('display_name, default_currency').eq('id', uid).single(),
    supabase.from('accounts').select('*').eq('user_id', uid).eq('archived', false).order('created_at'),
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
    supabase
      .from('insights')
      .select('*')
      .eq('user_id', uid)
      .eq('dismissed', false)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const currency = profile?.default_currency ?? 'ARS'

  // Calcular totales del mes
  const allTx = transactions ?? []
  const totalIncome  = allTx.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = allTx.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const summary: MonthSummary = {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    currency,
  }

  const monthLabel = new Date(year, month - 1).toLocaleString('es-AR', { month: 'long', year: 'numeric' })
  const greeting = getGreeting(profile?.display_name)

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{greeting}</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5 capitalize">{monthLabel}</p>
        </div>
        <Link
          href="/transactions"
          className="inline-flex items-center gap-2 h-10 px-4 rounded-[var(--radius-md)]
                     bg-[var(--color-accent)] text-white text-sm font-medium
                     hover:bg-[var(--color-accent-hover)] transition-colors
                     shadow-[0_0_16px_rgba(99,102,241,0.3)]"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Nueva transacción</span>
          <span className="sm:hidden">Agregar</span>
        </Link>
      </div>

      {/* Insights proactivos */}
      {(insights ?? []).length > 0 && (
        <InsightsBanner insights={insights ?? []} />
      )}

      {/* Resumen mensual */}
      <SummaryCards summary={summary} />

      {/* Cuentas + últimas transacciones */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* Últimas transacciones */}
        <RecentTransactions transactions={allTx} />

        {/* Cuentas */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[var(--color-text-primary)]">Cuentas</h2>
            <Link
              href="/accounts"
              className="text-xs text-[var(--color-accent)] hover:underline"
            >
              Gestionar
            </Link>
          </div>

          {(accounts ?? []).length === 0 ? (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-8 text-center">
              <Wallet size={28} className="mx-auto mb-3 text-[var(--color-text-muted)]" />
              <p className="text-sm text-[var(--color-text-secondary)]">No tenés cuentas todavía.</p>
              <Link
                href="/accounts"
                className="text-xs text-[var(--color-accent)] hover:underline mt-1 inline-block"
              >
                Agregar primera cuenta
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {(accounts ?? []).map((account) => (
                <AccountCard key={account.id} account={account} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getGreeting(name?: string | null): string {
  const hour = new Date().getHours()
  const base = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
  return name ? `${base}, ${name.split(' ')[0]}` : base
}
