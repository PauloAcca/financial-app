import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { TransactionList } from '@/components/transactions/transaction-list'
import { getCurrentMonth, getMonthRange } from '@/lib/utils'

export const metadata: Metadata = { title: 'Historial · Pixel Realm' }

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user!.id

  const { year, month } = getCurrentMonth()
  const { start, end } = getMonthRange(year, month)

  // Cargar cuentas, categorías y transacciones
  const [{ data: accounts }, { data: categories }, { data: transactions }] = await Promise.all([
    supabase
      .from('accounts')
      .select('*')
      .eq('user_id', uid)
      .eq('archived', false)
      .order('name'),

    supabase
      .from('categories')
      .select('*')
      .or(`user_id.eq.${uid},is_system.eq.true`)
      .order('name'),

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
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="flex flex-col gap-4 max-w-md mx-auto w-full font-mono">
      <TransactionList
        transactions={transactions ?? []}
        accounts={accounts ?? []}
        categories={categories ?? []}
      />
    </div>
  )
}
