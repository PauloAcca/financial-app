'use client'

import { useState } from 'react'
import Link from 'next/link'
import { History, Coffee, Car, Briefcase, ShoppingBag, Swords, Pencil } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { TransactionEditModal } from '@/components/transactions/transaction-edit-modal'
import type { Account, Category, Transaction } from '@/types/database'

interface RecentTransactionsProps {
  transactions: Transaction[]
  accounts?: Account[]
  categories?: Category[]
}

// Iconos temáticos según el nombre o categoría
function getMissionIcon(description?: string | null, categoryName?: string | null, type?: string) {
  const desc = (description || '').toLowerCase()
  const cat = (categoryName || '').toLowerCase()

  if (desc.includes('starbucks') || desc.includes('cafe') || desc.includes('mana') || cat.includes('comida') || cat.includes('alimento') || cat.includes('restaurante')) {
    return <Coffee size={18} className="text-[#8B92A9]" />
  }
  if (desc.includes('uber') || desc.includes('travel') || desc.includes('auto') || desc.includes('metro') || cat.includes('transporte') || cat.includes('viaje')) {
    return <Car size={18} className="text-[#8B92A9]" />
  }
  if (type === 'income' || desc.includes('recompensa') || desc.includes('sueldo') || desc.includes('salario') || cat.includes('ingreso') || cat.includes('sueldo')) {
    return <Briefcase size={18} className="text-[#00FF66]" />
  }
  return <ShoppingBag size={18} className="text-[#8B92A9]" />
}

export function RecentTransactions({ transactions, accounts = [], categories = [] }: RecentTransactionsProps) {
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const hasTransactions = transactions.length > 0
  const displayTx = transactions.slice(0, 5)

  return (
    <>
      <div className="bg-[#181c31] border border-[#293056] rounded-[4px] overflow-hidden shadow-sm font-mono">
        {/* Cabecera: MISIONES RECIENTES */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#293056] text-[#8B92A9] text-xs font-bold tracking-widest uppercase">
          <div className="flex items-center gap-2">
            <History size={15} className="stroke-[2.5]" />
            <span>MISIONES RECIENTES</span>
          </div>
          <span className="text-[10px] text-[#5d6786] tabular-nums">
            {transactions.length} TOTAL
          </span>
        </div>

        {/* Si NO hay transacciones reales */}
        {!hasTransactions ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-[4px] border border-[#293056] bg-[#14182b] flex items-center justify-center mb-1 text-[#5d6786]">
              <Swords size={22} />
            </div>
            <p className="text-xs font-bold text-white uppercase tracking-wide">
              SIN MISIONES REGISTRADAS
            </p>
            <p className="text-[11px] text-[#8B92A9] max-w-xs">
              Añadí tu primer botín o registrá un gasto para comenzar tu historial.
            </p>
          </div>
        ) : (
          /* Lista de Misiones REALES */
          <div className="divide-y divide-[#232845]">
            {displayTx.map((tx) => {
              const isIncome = tx.type === 'income'
              const formattedDate = formatDate(tx.occurred_at, 'short')

              return (
                <div
                  key={tx.id}
                  onClick={() => setEditingTx(tx)}
                  className="flex items-center justify-between p-4 hover:bg-[#1d223c] active:bg-[#20253f] transition-colors cursor-pointer group"
                >
                  {/* Icono + Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-[4px] bg-[#14182b] border border-[#293056] flex items-center justify-center shrink-0 group-hover:border-[#00FF66]/60 transition-colors">
                      {getMissionIcon(tx.description, tx.category?.name, tx.type)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs sm:text-sm font-bold text-white group-hover:text-[#00FF66] transition-colors truncate">
                          {tx.description || (isIncome ? 'Ingreso registrado' : 'Gasto registrado')}
                        </p>
                        <Pencil size={11} className="text-[#5d6786] group-hover:text-[#00FF66] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-[11px] text-[#8B92A9] mt-0.5">
                        {formattedDate} {tx.category?.name && `• ${tx.category.name}`}
                      </p>
                    </div>
                  </div>

                  {/* Monto */}
                  <div className="shrink-0 text-right">
                    <span
                      className={`text-xs sm:text-sm font-bold tabular-nums tracking-wider ${
                        isIncome ? 'text-[#00FF66] glow-text-green' : 'text-white'
                      }`}
                    >
                      {isIncome ? '+ ' : '- '}
                      {formatCurrency(tx.amount, tx.currency || 'ARS')}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Botón Inferior: VER TODA LA HISTORIA >> */}
        {hasTransactions && (
          <div className="p-3 border-t border-[#293056] bg-[#14182b]">
            <Link
              href="/transactions"
              prefetch={true}
              className="flex items-center justify-center w-full py-2.5 px-4 rounded-[4px] bg-[#181c31] border border-[#293056] text-white text-xs font-bold tracking-widest uppercase hover:border-[#00FF66] hover:text-[#00FF66] transition-all active:scale-[0.99]"
            >
              VER TODA LA HISTORIA &gt;&gt;
            </Link>
          </div>
        )}
      </div>

      {/* Modal para editar transacción */}
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
