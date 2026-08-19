'use client'

import { useState, useTransition } from 'react'
import {
  Trash2,
  Pencil,
  Briefcase,
  Pizza,
  Train,
  ShoppingCart,
  Coins,
  Shield,
  Coffee,
  Car,
  UtensilsCrossed,
  Layers,
  ArrowDownCircle,
  ArrowUpCircle,
  Plus
} from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { deleteTransaction } from '@/actions/transactions'
import { toast } from '@/components/ui/toast'
import { TransactionEditModal } from '@/components/transactions/transaction-edit-modal'
import type { Account, Category, Transaction, TransactionType } from '@/types/database'

interface TransactionListProps {
  transactions: Transaction[]
  accounts?: Account[]
  categories?: Category[]
}

// Icono y color del bloque según categoría o tipo
function getTransactionVisuals(tx: Transaction) {
  const desc = (tx.description || '').toLowerCase()
  const cat = (tx.category?.name || '').toLowerCase()

  if (tx.type === 'income' || desc.includes('recompensa') || desc.includes('sueldo') || cat.includes('salario') || cat.includes('ingreso')) {
    return {
      bgColor: 'bg-[#00FF66]',
      textColor: 'text-black',
      icon: <Briefcase size={20} className="stroke-[2.2]" />,
      defaultCategory: 'Gremio (Salario)',
      defaultTitle: 'Recompensa de Caza',
    }
  }

  if (desc.includes('racion') || desc.includes('comida') || desc.includes('pizza') || desc.includes('cena') || cat.includes('comida') || cat.includes('alimentacion')) {
    return {
      bgColor: 'bg-[#ff4d6d]',
      textColor: 'text-black',
      icon: <Pizza size={20} className="stroke-[2.2]" />,
      defaultCategory: 'Taberna (Comida)',
      defaultTitle: 'Suministro de Raciones',
    }
  }

  if (desc.includes('viaje') || desc.includes('metro') || desc.includes('uber') || desc.includes('transporte') || cat.includes('transporte')) {
    return {
      bgColor: 'bg-[#38d9f5]',
      textColor: 'text-black',
      icon: <Train size={20} className="stroke-[2.2]" />,
      defaultCategory: 'Metro (Transporte)',
      defaultTitle: 'Viaje Rápido',
    }
  }

  return {
    bgColor: 'bg-[#232847] border border-[#313a68]',
    textColor: 'text-[#8B92A9]',
    icon: <ShoppingCart size={20} className="stroke-[2]" />,
    defaultCategory: 'Mercader (Compras)',
    defaultTitle: 'Mejora de Armadura',
  }
}

export function TransactionList({ transactions, accounts = [], categories = [] }: TransactionListProps) {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [isPending, startTransition] = useTransition()

  // Si no hay transacciones, mostrar las 4 transacciones de demostración de la Foto 2
  const demoTransactions = [
    {
      id: 'demo-tx-1',
      description: 'Recompensa de Caza',
      category: { name: 'Gremio (Salario)' },
      type: 'income' as const,
      amount: 5000,
      currency: 'XP',
      occurred_at: new Date().toISOString(),
      formattedDate: 'Hoy, 09:00 AM',
    },
    {
      id: 'demo-tx-2',
      description: 'Suministro de Raciones',
      category: { name: 'Taberna (Comida)' },
      type: 'expense' as const,
      amount: 350,
      currency: 'XP',
      occurred_at: new Date(Date.now() - 86400000).toISOString(),
      formattedDate: 'Ayer, 19:30 PM',
    },
    {
      id: 'demo-tx-3',
      description: 'Viaje Rápido',
      category: { name: 'Metro (Transporte)' },
      type: 'expense' as const,
      amount: 45,
      currency: 'XP',
      occurred_at: new Date(Date.now() - 86400000).toISOString(),
      formattedDate: 'Ayer, 08:15 AM',
    },
    {
      id: 'demo-tx-4',
      description: 'Mejora de Armadura',
      category: { name: 'Mercader (Compras)' },
      type: 'expense' as const,
      amount: 1200,
      currency: 'XP',
      occurred_at: new Date(Date.now() - 172800000).toISOString(),
      formattedDate: 'Oct 24, 14:00 PM',
    },
  ]

  const rawList = transactions.length > 0 ? transactions : demoTransactions

  // Filtrar según pestaña seleccionada
  const filteredList = rawList.filter((tx) => {
    if (filter === 'income') return tx.type === 'income'
    if (filter === 'expense') return tx.type === 'expense'
    return true
  })

  function handleDelete(txId: string) {
    if (txId.startsWith('demo-')) {
      toast.info('Item de demostración')
      return
    }
    if (!confirm('¿Eliminás este registro?')) return
    startTransition(async () => {
      const res = await deleteTransaction(txId)
      if (res.success) toast.success('Registro eliminado')
      else toast.error(res.error)
    })
  }

  return (
    <div className="flex flex-col gap-4 font-mono">
      {/* 1. FILTRO SEGMENTADO: TODAS | BOTÍN | GASTOS */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'py-2.5 px-3 rounded-[4px] text-xs font-bold tracking-wider uppercase transition-all cursor-pointer text-center',
            filter === 'all'
              ? 'bg-[#00FF66] text-black shadow-[0_0_10px_rgba(0,255,102,0.4)]'
              : 'bg-[#1e233d] text-[#8B92A9] border border-[#293056] hover:text-white hover:bg-[#252b49]'
          )}
        >
          TODAS
        </button>

        <button
          onClick={() => setFilter('income')}
          className={cn(
            'py-2.5 px-3 rounded-[4px] text-xs font-bold tracking-wider uppercase transition-all cursor-pointer text-center',
            filter === 'income'
              ? 'bg-[#00FF66] text-black shadow-[0_0_10px_rgba(0,255,102,0.4)]'
              : 'bg-[#1e233d] text-[#8B92A9] border border-[#293056] hover:text-white hover:bg-[#252b49]'
          )}
        >
          BOTÍN
        </button>

        <button
          onClick={() => setFilter('expense')}
          className={cn(
            'py-2.5 px-3 rounded-[4px] text-xs font-bold tracking-wider uppercase transition-all cursor-pointer text-center',
            filter === 'expense'
              ? 'bg-[#00FF66] text-black shadow-[0_0_10px_rgba(0,255,102,0.4)]'
              : 'bg-[#1e233d] text-[#8B92A9] border border-[#293056] hover:text-white hover:bg-[#252b49]'
          )}
        >
          GASTOS
        </button>
      </div>

      {/* 2. LISTA DE TARJETAS DE TRANSACCIONES */}
      <div className="flex flex-col gap-3">
        {filteredList.map((tx: any) => {
          const isIncome = tx.type === 'income'
          const visuals = getTransactionVisuals(tx)
          const title = tx.description || visuals.defaultTitle
          const categoryName = tx.category?.name || visuals.defaultCategory
          const dateStr = tx.formattedDate || formatDate(tx.occurred_at, 'short')

          return (
            <div
              key={tx.id}
              className="group bg-[#181c31] border border-[#293056] rounded-[4px] p-4 flex items-center justify-between gap-3 hover:border-[#384277] transition-all relative"
            >
              {/* Bloque Izquierdo: Icono + Detalles */}
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Cuadrado de Icono Vibrante */}
                <div
                  className={cn(
                    'w-12 h-12 rounded-[4px] flex items-center justify-center shrink-0 shadow-sm',
                    visuals.bgColor,
                    visuals.textColor
                  )}
                >
                  {visuals.icon}
                </div>

                {/* Textos */}
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white tracking-wide truncate">
                    {title}
                  </h3>
                  <p className="text-xs text-[#8B92A9] mt-0.5 truncate">
                    {categoryName}
                  </p>
                  <p className="text-[11px] text-[#00FF66] font-mono mt-1 glow-text-green">
                    {dateStr}
                  </p>
                </div>
              </div>

              {/* Bloque Derecho: Monto + Tag INGRESO / GASTO */}
              <div className="flex flex-col items-end shrink-0 gap-1.5">
                <span
                  className={cn(
                    'text-sm sm:text-base font-bold tabular-nums tracking-wide',
                    isIncome ? 'text-[#00FF66] glow-text-green' : 'text-white'
                  )}
                >
                  {isIncome ? '+ ' : '- '}
                  {typeof tx.amount === 'number' ? tx.amount.toLocaleString('es-AR') : tx.amount} {tx.currency === 'XP' ? 'XP' : tx.currency || 'XP'}
                </span>

                {/* Badge INGRESO / GASTO */}
                <span
                  className={cn(
                    'text-[9px] font-bold px-2 py-0.5 rounded-[2px] tracking-widest uppercase border',
                    isIncome
                      ? 'border-[#00FF66]/40 text-[#00FF66] bg-[#00FF66]/10'
                      : 'border-[#293056] text-[#8B92A9] bg-[#14182b]'
                  )}
                >
                  {isIncome ? 'INGRESO' : 'GASTO'}
                </span>

                {/* Acciones flotantes para transacciones reales */}
                {!tx.id.startsWith('demo-') && (
                  <div className="hidden group-hover:flex items-center gap-1.5 mt-1">
                    <button
                      onClick={() => setEditingTx(tx)}
                      className="p-1 rounded bg-[#20253f] text-[#8B92A9] hover:text-white"
                      title="Editar"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      disabled={isPending}
                      className="p-1 rounded bg-[#20253f] text-[#ff4d6d] hover:bg-[#ff4d6d]/20"
                      title="Eliminar"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <TransactionEditModal
        open={!!editingTx}
        onClose={() => setEditingTx(null)}
        transaction={editingTx}
        accounts={accounts}
        categories={categories}
      />
    </div>
  )
}
