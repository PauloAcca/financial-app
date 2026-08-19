'use client'

import Link from 'next/link'
import { History, Coffee, Car, Briefcase, ShoppingBag, ArrowUpRight, ArrowDownRight, Tag } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Transaction } from '@/types/database'

interface RecentTransactionsProps {
  transactions: Transaction[]
}

// Iconos temáticos según el nombre o categoría
function getMissionIcon(description?: string | null, categoryName?: string | null, type?: string) {
  const desc = (description || '').toLowerCase()
  const cat = (categoryName || '').toLowerCase()

  if (desc.includes('starbucks') || desc.includes('cafe') || desc.includes('mana') || cat.includes('comida') || cat.includes('alimento')) {
    return <Coffee size={18} className="text-[#8B92A9]" />
  }
  if (desc.includes('uber') || desc.includes('travel') || desc.includes('auto') || desc.includes('metro') || cat.includes('transporte')) {
    return <Car size={18} className="text-[#8B92A9]" />
  }
  if (type === 'income' || desc.includes('recompensa') || desc.includes('sueldo') || desc.includes('salario') || cat.includes('ingreso')) {
    return <Briefcase size={18} className="text-[#8B92A9]" />
  }
  return <ShoppingBag size={18} className="text-[#8B92A9]" />
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  // Si no hay transacciones, mostramos ejemplos temáticos RPG idénticos al screenshot
  const displayTx = transactions.length > 0 ? transactions.slice(0, 5) : [
    {
      id: 'demo-1',
      description: 'Mana Potion (Starbucks)',
      amount: 5.50,
      type: 'expense' as const,
      currency: 'USD',
      occurred_at: new Date().toISOString(),
      formattedDate: 'Hoy, 09:42 AM',
    },
    {
      id: 'demo-2',
      description: 'Fast Travel (Uber)',
      amount: 24.00,
      type: 'expense' as const,
      currency: 'USD',
      occurred_at: new Date(Date.now() - 86400000).toISOString(),
      formattedDate: 'Ayer, 11:20 PM',
    },
    {
      id: 'demo-3',
      description: 'Recompensa (Salario)',
      amount: 2450.00,
      type: 'income' as const,
      currency: 'USD',
      occurred_at: new Date(Date.now() - 172800000).toISOString(),
      formattedDate: 'Oct 24, 08:00 AM',
    }
  ]

  return (
    <div className="bg-[#181c31] border border-[#293056] rounded-[4px] overflow-hidden shadow-sm font-mono">
      {/* Cabecera: MISIONES RECIENTES */}
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-[#293056] text-[#8B92A9] text-xs font-bold tracking-widest uppercase">
        <History size={15} className="stroke-[2.5]" />
        <span>MISIONES RECIENTES</span>
      </div>

      {/* Lista de Misiones */}
      <div className="divide-y divide-[#232845]">
        {displayTx.map((tx: any) => {
          const isIncome = tx.type === 'income'
          const formattedDate = tx.formattedDate || formatDate(tx.occurred_at, 'short')

          return (
            <div
              key={tx.id}
              className="flex items-center justify-between p-4 hover:bg-[#1d223c] transition-colors"
            >
              {/* Icono + Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-[4px] bg-[#14182b] border border-[#293056] flex items-center justify-center shrink-0">
                  {getMissionIcon(tx.description, tx.category?.name, tx.type)}
                </div>

                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-white truncate">
                    {tx.description || (isIncome ? 'Recompensa de Caza' : 'Gasto de Misión')}
                  </p>
                  <p className="text-[11px] text-[#8B92A9] mt-0.5">
                    {formattedDate}
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
                  {formatCurrency(tx.amount, tx.currency || 'USD')}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Botón Inferior: VER TODA LA HISTORIA >> */}
      <div className="p-3 border-t border-[#293056] bg-[#14182b]">
        <Link
          href="/transactions"
          className="flex items-center justify-center w-full py-2.5 px-4 rounded-[4px] bg-[#181c31] border border-[#293056] text-white text-xs font-bold tracking-widest uppercase hover:border-[#00FF66] hover:text-[#00FF66] transition-all"
        >
          VER TODA LA HISTORIA &gt;&gt;
        </Link>
      </div>
    </div>
  )
}
