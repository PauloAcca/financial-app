import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ProfileClient } from '@/components/profile/profile-client'
import { calculateUserGameStats } from '@/lib/gamification'
import { DEFAULT_CURRENCY } from '@/lib/constants'

export const metadata: Metadata = { title: 'Perfil · Pixel Realm' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user!.id

  const [{ data: profile }, { data: accounts }, { data: transactions }] = await Promise.all([
    supabase.from('profiles').select('display_name, default_currency').eq('id', uid).single(),
    supabase.from('accounts').select('*').eq('user_id', uid).eq('archived', false).order('created_at'),
    supabase
      .from('transactions')
      .select(`
        *,
        account:accounts!account_id(id, name, color, icon),
        category:categories!category_id(id, name, color, icon)
      `)
      .eq('user_id', uid)
      .order('occurred_at', { ascending: false }),
  ])

  const realAccounts = accounts ?? []
  const realTransactions = transactions ?? []
  const currency = profile?.default_currency ?? DEFAULT_CURRENCY
  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'JUGADOR'

  // Calcular estadísticas, nivel (comienza en Nivel 1) y logros 100% REALES
  const stats = calculateUserGameStats(realAccounts, realTransactions)

  return (
    <ProfileClient
      displayName={displayName}
      currency={currency}
      stats={stats}
    />
  )
}
