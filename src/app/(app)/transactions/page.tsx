import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { TransactionForm } from '@/components/transactions/transaction-form'
import { TransactionList } from '@/components/transactions/transaction-list'
import { CsvImporter } from '@/components/transactions/csv-importer'
import { getCurrentMonth, getMonthRange } from '@/lib/utils'

export const metadata: Metadata = { title: 'Transacciones' }

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user!.id

  const { year, month } = getCurrentMonth()
  const { start, end } = getMonthRange(year, month)

  // Cargar cuentas activas, categorías y transacciones del mes en paralelo
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

  // Obtener moneda predeterminada del profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('default_currency')
    .eq('id', uid)
    .single()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
      {/* Columna izquierda: formulario */}
      <div className="lg:sticky lg:top-6">
        <TransactionForm
          accounts={accounts ?? []}
          categories={categories ?? []}
          defaultCurrency={profile?.default_currency ?? 'ARS'}
        />
      </div>

      {/* Columna derecha: lista del mes */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
              Movimientos — {new Date(year, month - 1).toLocaleString('es-AR', { month: 'long', year: 'numeric' })}
            </h2>
            <span className="text-xs text-[var(--color-text-muted)] tabular-nums">
              {transactions?.length ?? 0} registros
            </span>
          </div>
          
          <CsvImporter accounts={accounts ?? []} />
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] overflow-hidden">
          <TransactionList transactions={transactions ?? []} />
        </div>
      </div>
    </div>
  )
}
