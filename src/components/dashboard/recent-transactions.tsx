'use client'

import { useState } from 'react'
import Link from 'next/link'
import { History, Coffee, Car, Briefcase, ShoppingBag, TrendingUp, Pencil } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { buildInvestmentAccountIds, isInvestmentTransaction } from '@/lib/investments'
import { TransactionEditModal } from '@/components/transactions/transaction-edit-modal'
import type { Account, Category, Transaction } from '@/types/database'

interface RecentTransactionsProps {
  transactions: Transaction[]
  accounts?: Account[]
  categories?: Category[]
}

// Iconos temáticos según el nombre o categoría
function getTxIcon(
  description: string | null | undefined,
  categoryName: string | null | undefined,
  type: string | undefined,
  isInvestment: boolean
) {
  const desc = (description || '').toLowerCase()
  const cat = (categoryName || '').toLowerCase()

  if (isInvestment) {
    return <TrendingUp size={18} className="text-[var(--color-investment)]" />
  }
  if (
    desc.includes('starbucks') ||
    desc.includes('cafe') ||
    desc.includes('mana') ||
    cat.includes('comida') ||
    cat.includes('alimento') ||
    cat.includes('restaurante')
  ) {
    return <Coffee size={18} className="text-[var(--color-text-secondary)]" />
  }
  if (
    desc.includes('uber') ||
    desc.includes('travel') ||
    desc.includes('auto') ||
    desc.includes('metro') ||
    cat.includes('transporte') ||
    cat.includes('viaje')
  ) {
    return <Car size={18} className="text-[var(--color-text-secondary)]" />
  }
  if (
    type === 'income' ||
    desc.includes('recompensa') ||
    desc.includes('sueldo') ||
    desc.includes('salario') ||
    cat.includes('ingreso') ||
    cat.includes('sueldo')
  ) {
    return <Briefcase size={18} className="text-[var(--color-income)]" />
  }
  return <ShoppingBag size={18} className="text-[var(--color-text-secondary)]" />
}

export function RecentTransactions({ transactions, accounts = [], categories = [] }: RecentTransactionsProps) {
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const hasTransactions = transactions.length > 0
  const displayTx = transactions.slice(0, 5)

  const investmentAccountIds = buildInvestmentAccountIds(accounts)

  return (
    <>
      <div className="glass rounded-[var(--radius-lg)] overflow-hidden">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[rgba(255,255,255,0.07)] text-[var(--color-text-secondary)]">
          <div className="flex items-center gap-2">
            <History size={15} className="stroke-[2]" />
            <span className="text-xs font-medium">Actividad reciente</span>
          </div>
          <span className="text-[0.6875rem] text-[var(--color-text-muted)] tabular-nums">
            {transactions.length} en total
          </span>
        </div>

        {/* Estado vacío */}
        {!hasTransactions ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-[var(--radius-full)] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] flex items-center justify-center mb-1 text-[var(--color-text-muted)]">
              <History size={20} />
            </div>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              Sin movimientos aún
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] max-w-xs">
              Registrá tu primer ingreso o gasto para comenzar tu historial.
            </p>
          </div>
        ) : (
          /* Lista de movimientos */
          <div className="divide-y divide-[rgba(255,255,255,0.05)]">
            {displayTx.map((tx) => {
              const isInvestment = isInvestmentTransaction(tx, investmentAccountIds)
              const isIncomingInvestment = isInvestment && !investmentAccountIds.has(tx.account_id)
              const isPositive = tx.type === 'income' || isIncomingInvestment
              const formattedDate = formatDate(tx.occurred_at, 'short')

              return (
                <div
                  key={tx.id}
                  onClick={() => setEditingTx(tx)}
                  className="flex items-center justify-between p-4 hover:bg-[rgba(255,255,255,0.03)] active:bg-[rgba(255,255,255,0.05)] transition-colors cursor-pointer group"
                >
                  {/* Icono + Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] flex items-center justify-center shrink-0 group-hover:border-[rgba(143,203,176,0.4)] transition-colors">
                      {getTxIcon(tx.description, tx.category?.name, tx.type, isInvestment)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs sm:text-sm font-medium text-[var(--color-text-primary)] truncate">
                          {tx.description || (isPositive ? 'Ingreso registrado' : 'Gasto registrado')}
                        </p>
                        <Pencil
                          size={11}
                          className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] shrink-0 opacity-60 group-hover:opacity-100 transition-all"
                        />
                      </div>
                      <p className="text-[0.6875rem] text-[var(--color-text-secondary)] mt-0.5">
                        {formattedDate} {tx.category?.name && `• ${tx.category.name}`}
                      </p>
                    </div>
                  </div>

                  {/* Monto */}
                  <div className="shrink-0 text-right">
                    <span
                      className={`text-xs sm:text-sm font-semibold tabular-nums ${
                        isInvestment
                          ? 'text-[var(--color-investment)]'
                          : isPositive
                          ? 'text-[var(--color-income)]'
                          : 'text-[var(--color-text-primary)]'
                      }`}
                    >
                      {isPositive ? '+ ' : '- '}
                      {formatCurrency(tx.amount, tx.currency || 'ARS')}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Ver todo */}
        {hasTransactions && (
          <div className="p-3 border-t border-[rgba(255,255,255,0.07)]">
            <Link
              href="/transactions"
              prefetch={true}
              className="flex items-center justify-center w-full py-2.5 px-4 rounded-[var(--radius-md)] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] text-[var(--color-text-secondary)] text-sm font-medium hover:text-[var(--color-accent)] hover:border-[rgba(143,203,176,0.35)] hover:bg-[rgba(143,203,176,0.06)] transition-all active:scale-[0.99]"
            >
              Ver todo el historial
            </Link>
          </div>
        )}
      </div>

      {/* Modal para editar o eliminar transacción */}
      <TransactionEditModal
        open={!!editingTx}
        onClose={() => setEditingTx(null)}
        transaction={editingTx}
        accounts={accounts}
        categories={categories}
      />
    </>
  )
}
