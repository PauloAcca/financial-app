import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { InvestmentsClient } from './client'
import { buildPlatform } from '@/lib/investments'
import { DEFAULT_CURRENCY } from '@/lib/constants'
import type { Account, InvestmentValuation, Transaction } from '@/types/database'

export const metadata: Metadata = { title: 'Inversiones · Pixel Realm' }

export default async function InvestmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user!.id

  const [{ data: accounts }, { data: profile }] = await Promise.all([
    supabase
      .from('accounts')
      .select('*')
      .eq('user_id', uid)
      .eq('type', 'investment')
      .order('created_at'),
    supabase
      .from('profiles')
      .select('default_currency')
      .eq('id', uid)
      .single(),
  ])

  const allAccounts = (accounts ?? []) as Account[]
  const ids = allAccounts.map((a) => a.id)

  let transactions: Transaction[] = []
  let valuations: InvestmentValuation[] = []

  if (ids.length > 0) {
    const idList = ids.join(',')
    const [txRes, valRes] = await Promise.all([
      supabase
        .from('transactions')
        .select(`
          *,
          account:accounts!account_id(id, name, color, icon),
          category:categories!category_id(id, name, color, icon),
          transfer_account:accounts!transfer_account_id(id, name)
        `)
        .eq('user_id', uid)
        .or(`account_id.in.(${idList}),transfer_account_id.in.(${idList})`)
        .order('occurred_at', { ascending: false }),
      supabase
        .from('investment_valuations')
        .select('*')
        .eq('user_id', uid)
        .in('account_id', ids)
        .order('valued_at', { ascending: false }),
    ])

    transactions = (txRes.data ?? []) as Transaction[]
    valuations = (valRes.data ?? []) as InvestmentValuation[]
  }

  const platforms = allAccounts
    .map((account) =>
      buildPlatform(
        account,
        transactions,
        valuations.filter((v) => v.account_id === account.id)
      )
    )
    .sort((a, b) => b.currentValue - a.currentValue)

  // Todas las cuentas activas (para elegir origen/destino de aportes)
  const { data: pickerAccounts } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', uid)
    .eq('archived', false)
    .order('name')

  return (
    <InvestmentsClient
      platforms={platforms}
      accounts={(pickerAccounts ?? []) as Account[]}
      defaultCurrency={profile?.default_currency ?? DEFAULT_CURRENCY}
    />
  )
}
