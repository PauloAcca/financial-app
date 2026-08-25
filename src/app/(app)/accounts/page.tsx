import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AccountsClient } from './client'

export const metadata: Metadata = { title: 'Cuentas · Pixel Realm' }

export default async function AccountsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user!.id

  const [{ data: accounts }, { data: categories }, { data: transactions }] = await Promise.all([
    supabase
      .from('accounts')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: true }),

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
      .order('occurred_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(300),
  ])

  return (
    <AccountsClient
      accounts={accounts ?? []}
      categories={categories ?? []}
      transactions={transactions ?? []}
    />
  )
}
