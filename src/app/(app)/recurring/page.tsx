import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { RecurringClient } from './client'

export const metadata: Metadata = { title: 'Gastos Fijos' }

export default async function RecurringPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user!.id

  const now = new Date()
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Cargar recurrentes primero para poder consultar los pagos por sus IDs
  const { data: recurring } = await supabase
    .from('recurring_transactions')
    .select('*, account:accounts!account_id(id, name, color, icon), category:categories!category_id(id, name, color, icon)')
    .eq('user_id', uid)
    .order('created_at', { ascending: false })

  const recurringIds = (recurring ?? []).map((r) => r.id)

  const [{ data: accounts }, { data: categories }, { data: payments }, { data: profile }] = await Promise.all([
    supabase.from('accounts').select('id, name, type, currency, color, icon').eq('user_id', uid).eq('archived', false),
    supabase.from('categories').select('id, name, kind, color').or(`user_id.eq.${uid},is_system.eq.true`),
    recurringIds.length > 0
      ? supabase
          .from('recurring_transaction_payments')
          .select('*')
          .in('recurring_transaction_id', recurringIds)
          .eq('period', currentPeriod)
      : Promise.resolve({ data: [] }),
    supabase.from('profiles').select('default_currency').eq('id', uid).single(),
  ])

  return (
    <RecurringClient
      recurring={recurring ?? []}
      accounts={accounts ?? []}
      categories={categories ?? []}
      payments={payments ?? []}
      currentPeriod={currentPeriod}
      defaultCurrency={profile?.default_currency ?? 'ARS'}
    />
  )
}
