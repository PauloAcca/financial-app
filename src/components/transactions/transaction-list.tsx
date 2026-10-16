'use client'

import { useState, useTransition } from 'react'
import {
  Trash2,
  Pencil,
  Briefcase,
  Pizza,
  Train,
  ShoppingCart,
  ReceiptText,
  TrendingUp
} from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { buildInvestmentAccountIds, isInvestmentTransaction } from '@/lib/investments'
import { deleteTransaction } from '@/actions/transactions'
import { toast } from '@/components/ui/toast'
import { Badge } from '@/components/ui/badge'
import { TransactionEditModal } from '@/components/transactions/transaction-edit-modal'
import type { Account, Category, Transaction } from '@/types/database'

interface TransactionListProps {
  transactions: Transaction[]
  accounts?: Account[]
  categories?: Category[]
}

// Icono y color del bloque según categoría o tipo
function getTransactionVisuals(tx: Transaction, isInvestment: boolean) {
  const desc = (tx.description || '').toLowerCase()
  const cat = (tx.category?.name || '').toLowerCase()

  if (isInvestment && tx.type !== 'expense') {
    return {
      bgColor: 'bg-[var(--color-investment-subtle)]',
      textColor: 'text-[var(--color-investment)]',
      badgeText: 'Inversión',
      badgeVariant: 'investment' as const,
      icon: <TrendingUp size={20} className="stroke-[2]" />,
      defaultCategory: 'Inversiones y activos',
      defaultTitle: 'Inversión registrada',
      isPositive: true,
    }
  }

  if (tx.type === 'income' || desc.includes('recompensa') || desc.includes('sueldo') || cat.includes('salario') || cat.includes('ingreso')) {
    return {
      bgColor: 'bg-[var(--color-income-subtle)]',
      textColor: 'text-[var(--color-income)]',
      badgeText: 'Ingreso',
      badgeVariant: 'income' as const,
      icon: <Briefcase size={20} className="stroke-[2]" />,
      defaultCategory: 'Ingreso / Salario',
      defaultTitle: 'Ingreso registrado',
      isPositive: true,
    }
  }

  if (desc.includes('racion') || desc.includes('comida') || desc.includes('pizza') || desc.includes('cena') || cat.includes('comida') || cat.includes('alimento') || cat.includes('restaurante')) {
    return {
      bgColor: 'bg-[var(--color-expense-subtle)]',
      textColor: 'text-[var(--color-expense)]',
      badgeText: 'Gasto',
      badgeVariant: 'expense' as const,
      icon: <Pizza size={20} className="stroke-[2]" />,
      defaultCategory: 'Comida / Restaurant',
      defaultTitle: 'Gasto de comida',
      isPositive: false,
    }
  }

  if (desc.includes('viaje') || desc.includes('metro') || desc.includes('uber') || desc.includes('transporte') || cat.includes('transporte') || cat.includes('viaje')) {
    return {
      bgColor: 'bg-[var(--color-transfer-subtle)]',
      textColor: 'text-[var(--color-transfer)]',
      badgeText: 'Gasto',
      badgeVariant: 'expense' as const,
      icon: <Train size={20} className="stroke-[2]" />,
      defaultCategory: 'Transporte / Viaje',
      defaultTitle: 'Gasto de transporte',
      isPositive: false,
    }
  }

  return {
    bgColor: 'bg-[rgba(255,255,255,0.05)]',
    textColor: 'text-[var(--color-text-secondary)]',
    badgeText: 'Gasto',
    badgeVariant: 'expense' as const,
    icon: <ShoppingCart size={20} className="stroke-[2]" />,
    defaultCategory: 'Compras y servicios',
    defaultTitle: 'Gasto registrado',
    isPositive: false,
  }
}

export function TransactionList({ transactions = [], accounts = [], categories = [] }: TransactionListProps) {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [isPending, startTransition] = useTransition()

  const investmentAccountIds = buildInvestmentAccountIds(accounts)
  const isInvestment = (tx: Transaction) => isInvestmentTransaction(tx, investmentAccountIds)

  // Filtrar según pestaña seleccionada.
  // Los movimientos que entran a una cuenta de inversión cuentan como ingresos;
  // los que salen (retiros/comisiones) no son gasto de consumo.
  const filteredList = transactions.filter((tx) => {
    if (filter === 'income') return tx.type === 'income' || (isInvestment(tx) && tx.type !== 'expense')
    if (filter === 'expense') return tx.type === 'expense' && !isInvestment(tx)
    return true
  })

  function handleDelete(e: React.MouseEvent, txId: string) {
    e.stopPropagation()
    if (!confirm('¿Estás seguro de que querés eliminar esta transacción de forma permanente?')) return

    startTransition(async () => {
      const res = await deleteTransaction(txId)
      if (res.success) toast.success('Transacción eliminada con éxito.')
      else toast.error(res.error)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 1. FILTRO SEGMENTADO: Todas | Ingresos | Gastos */}
      <div className="grid grid-cols-3 gap-1 p-1 glass rounded-[var(--radius-md)]">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'py-2 px-3 rounded-[var(--radius-sm)] text-xs font-medium transition-all cursor-pointer text-center',
            filter === 'all'
              ? 'bg-[rgba(255,255,255,0.1)] text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-secondary)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--color-text-primary)]'
          )}
        >
          Todas
        </button>

        <button
          onClick={() => setFilter('income')}
          className={cn(
            'py-2 px-3 rounded-[var(--radius-sm)] text-xs font-medium transition-all cursor-pointer text-center',
            filter === 'income'
              ? 'bg-[rgba(255,255,255,0.1)] text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-secondary)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--color-text-primary)]'
          )}
        >
          Ingresos
        </button>

        <button
          onClick={() => setFilter('expense')}
          className={cn(
            'py-2 px-3 rounded-[var(--radius-sm)] text-xs font-medium transition-all cursor-pointer text-center',
            filter === 'expense'
              ? 'bg-[rgba(255,255,255,0.1)] text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-secondary)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--color-text-primary)]'
          )}
        >
          Gastos
        </button>
      </div>

      {/* 2. LISTA DE TARJETAS DE TRANSACCIONES */}
      {filteredList.length === 0 ? (
        <div className="glass rounded-[var(--radius-lg)] p-8 text-center flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-[var(--radius-full)] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[var(--color-text-muted)] mb-1">
            <ReceiptText size={20} />
          </div>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            Sin movimientos registrados
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] max-w-xs">
            {filter === 'income'
              ? 'Todavía no registraste ingresos ni inversiones.'
              : filter === 'expense'
              ? 'Todavía no registraste gastos.'
              : 'Tus transacciones aparecerán aquí en cuanto las agregues.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredList.map((tx) => {
            const visuals = getTransactionVisuals(tx, isInvestment(tx))
            const title = tx.description || visuals.defaultTitle
            const categoryName = tx.category?.name || visuals.defaultCategory
            const dateStr = formatDate(tx.occurred_at, 'short')

            return (
              <div
                key={tx.id}
                onClick={() => setEditingTx(tx)}
                className="group glass rounded-[var(--radius-lg)] p-4 flex items-center justify-between gap-3 hover:bg-[rgba(255,255,255,0.07)] hover:border-[rgba(143,203,176,0.35)] active:bg-[rgba(255,255,255,0.09)] transition-all relative cursor-pointer"
              >
                {/* Bloque Izquierdo: Icono + Detalles */}
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Cuadrado de icono */}
                  <div
                    className={cn(
                      'w-11 h-11 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0',
                      visuals.bgColor,
                      visuals.textColor
                    )}
                  >
                    {visuals.icon}
                  </div>

                  {/* Textos */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-medium text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-accent)] transition-colors">
                        {title}
                      </h3>
                      <Pencil size={11} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] shrink-0 opacity-60 group-hover:opacity-100 transition-all" />
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 truncate">
                      {categoryName} {tx.account?.name && `• ${tx.account.name}`}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[11px] text-[var(--color-text-muted)] tabular-nums">
                        {dateStr}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bloque Derecho: Monto + Tag + Botón Papelera */}
                <div className="flex flex-col items-end shrink-0 gap-1.5">
                  <span
                    className={cn(
                      'text-sm sm:text-base font-semibold tabular-nums',
                      visuals.isPositive ? 'text-[var(--color-income)]' : 'text-[var(--color-text-primary)]'
                    )}
                  >
                    {visuals.isPositive ? '+ ' : '- '}
                    {formatCurrency(tx.amount, tx.currency || 'ARS')}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Badge */}
                    {visuals.badgeVariant === 'investment' ? (
                      <Badge variant="default" className="bg-[var(--color-investment-subtle)] text-[var(--color-investment)]">
                        {visuals.badgeText}
                      </Badge>
                    ) : (
                      <Badge variant={visuals.badgeVariant}>
                        {visuals.badgeText}
                      </Badge>
                    )}

                    {/* Botón Eliminar rápido */}
                    <button
                      onClick={(e) => handleDelete(e, tx.id)}
                      disabled={isPending}
                      className="p-1.5 rounded-[var(--radius-sm)] bg-[rgba(255,255,255,0.06)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)] transition-colors cursor-pointer"
                      title="Eliminar transacción"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal para editar o borrar transacción */}
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
