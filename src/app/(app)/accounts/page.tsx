import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AccountsClient } from './client'

export const metadata: Metadata = { title: 'Cuentas' }

export default async function AccountsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: accounts } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: true })

  return <AccountsClient accounts={accounts ?? []} />
}
