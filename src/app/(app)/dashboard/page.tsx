import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { ActionButtons } from '@/components/dashboard/action-buttons'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { calculateUserGameStats } from '@/lib/gamification'
import { DEFAULT_CURRENCY } from '@/lib/constants'

export const metadata: Metadata = { title: 'Inicio · Pixel Realm' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user!.id

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
      .order('occurred_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const currency = profile?.default_currency ?? DEFAULT_CURRENCY
  const realAccounts = accounts ?? []
  const realTransactions = transactions ?? []

  // Calcular estadísticas, nivel y saldo 100% REALES
  const stats = calculateUserGameStats(realAccounts, realTransactions)

  return (
    <div className="flex flex-col gap-4 max-w-md mx-auto w-full font-mono">
      {/* 1. HUD Resumen de Saldo y XP Real */}
      <SummaryCards stats={stats} currency={currency} />

      {/* 2. Botones de Acción: AÑADIR BOTÍN y PAGAR JEFE */}
      <ActionButtons
        accounts={realAccounts}
        categories={categories ?? []}
      />

      {/* 3. Misiones Recientes Reales */}
      <RecentTransactions transactions={realTransactions} />
    </div>
  )
}
