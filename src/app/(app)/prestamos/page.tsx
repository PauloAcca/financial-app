import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { LoansClient } from './client'
import { DEFAULT_CURRENCY } from '@/lib/constants'

export const metadata: Metadata = { title: 'Préstamos y Deudas · Pixel Realm' }

export default async function LoansPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user!.id

  const [{ data: loans }, { data: accounts }, { data: profile }] = await Promise.all([
    supabase
      .from('loans')
      .select(`
        *,
        account:accounts!account_id(id, name, color, icon),
        payments:loan_payments(
          *,
          account:accounts!account_id(id, name, color, icon)
        )
      `)
      .eq('user_id', uid)
      .order('created_at', { ascending: false }),

    supabase
      .from('accounts')
      .select('*')
      .eq('user_id', uid)
      .eq('archived', false)
      .order('name'),

    supabase
      .from('profiles')
      .select('default_currency')
      .eq('id', uid)
      .single(),
  ])

  return (
    <LoansClient
      loans={loans ?? []}
      accounts={accounts ?? []}
      defaultCurrency={profile?.default_currency ?? DEFAULT_CURRENCY}
    />
  )
}
