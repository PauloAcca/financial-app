'use client'

import { useEffect, useState, useTransition } from 'react'
import { Loader2, Plus, Minus } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import {
  getCategoryTransactions,
  getUncategorizedTransactions,
  assignTransactionsToCategory,
  unassignTransactions,
  type CategoryTransactionItem,
} from '@/actions/categories'
import type { Category } from '@/types/database'

interface CategoryTransactionsModalProps {
  open: boolean
  onClose: () => void
  category: Category | null
}

function TxRow({
  tx,
  checked,
  onToggle,
}: {
  tx: CategoryTransactionItem
  checked: boolean
  onToggle: () => void
}) {
  const isIncome = tx.type === 'income'
  return (
    <label
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] cursor-pointer transition-colors',
        checked
          ? 'bg-[var(--color-accent-subtle)] border border-[rgba(143,203,176,0.4)]'
          : 'hover:bg-[rgba(255,255,255,0.06)] border border-transparent'
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="accent-[var(--color-accent)] cursor-pointer shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[var(--color-text-primary)] truncate">{tx.description || 'Sin descripción'}</p>
        <p className="text-[10px] text-[var(--color-text-secondary)] truncate">
          {formatDate(tx.occurred_at, 'short')}
          {tx.account?.name ? ` · ${tx.account.name}` : ''}
        </p>
      </div>
      <span
        className={cn(
          'text-xs font-semibold tabular-nums shrink-0',
          isIncome ? 'text-[var(--color-income)]' : 'text-[var(--color-text-primary)]'
        )}
      >
        {isIncome ? '+' : '−'} {formatCurrency(Number(tx.amount), tx.currency)}
      </span>
    </label>
  )
}

function toggleId(setter: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) {
  setter((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })
}

export function CategoryTransactionsModal({ open, onClose, category }: CategoryTransactionsModalProps) {
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(false)
  const [inCategory, setInCategory] = useState<CategoryTransactionItem[]>([])
  const [uncategorized, setUncategorized] = useState<CategoryTransactionItem[]>([])
  const [toAdd, setToAdd] = useState<Set<string>>(new Set())
  const [toRemove, setToRemove] = useState<Set<string>>(new Set())
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!open || !category) return
    let cancelled = false

    async function load() {
      setLoading(true)
      const [catRes, uncatRes] = await Promise.all([
        getCategoryTransactions(category!.id),
        getUncategorizedTransactions(category!.kind),
      ])
      if (cancelled) return
      setInCategory(catRes.success ? catRes.data : [])
      setUncategorized(uncatRes.success ? uncatRes.data : [])
      setToAdd(new Set())
      setToRemove(new Set())
      setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [open, category, refreshKey])

  function handleAdd() {
    if (!category || toAdd.size === 0) return
    startTransition(async () => {
      const res = await assignTransactionsToCategory([...toAdd], category.id)
      if (res.success) {
        toast.success(`${toAdd.size} movimiento${toAdd.size !== 1 ? 's' : ''} asignado${toAdd.size !== 1 ? 's' : ''}.`)
        setRefreshKey((k) => k + 1)
      } else {
        toast.error(res.error)
      }
    })
  }

  function handleRemove() {
    if (toRemove.size === 0) return
    startTransition(async () => {
      const res = await unassignTransactions([...toRemove])
      if (res.success) {
        toast.success(`${toRemove.size} movimiento${toRemove.size !== 1 ? 's' : ''} sin categoría.`)
        setRefreshKey((k) => k + 1)
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Gestionar movimientos"
      description={category ? category.name : undefined}
      size="lg"
    >
      {loading ? (
        <div className="flex items-center justify-center py-10 text-[var(--color-text-secondary)]">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-5 max-h-[65vh] overflow-y-auto pr-1">
          {/* Movimientos actuales de la categoría */}
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-medium text-[var(--color-text-secondary)]">
                En esta categoría ({inCategory.length})
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={toRemove.size === 0 || isPending}
                className="text-[var(--color-danger)] hover:text-[var(--color-danger)]"
              >
                <Minus size={12} /> Quitar seleccionados
              </Button>
            </div>
            {inCategory.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)] py-3 text-center">
                No hay movimientos en esta categoría.
              </p>
            ) : (
              <div className="flex flex-col gap-1 max-h-52 overflow-y-auto">
                {inCategory.map((tx) => (
                  <TxRow
                    key={tx.id}
                    tx={tx}
                    checked={toRemove.has(tx.id)}
                    onToggle={() => toggleId(setToRemove, tx.id)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Movimientos sin categoría del mismo tipo */}
          <section className="flex flex-col gap-2 border-t border-[rgba(255,255,255,0.06)] pt-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-medium text-[var(--color-text-secondary)]">
                Sin categoría ({uncategorized.length})
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAdd}
                disabled={toAdd.size === 0 || isPending}
                className="text-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                <Plus size={12} /> Agregar seleccionados
              </Button>
            </div>
            {uncategorized.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)] py-3 text-center">
                No hay movimientos sin categoría de este tipo.
              </p>
            ) : (
              <div className="flex flex-col gap-1 max-h-52 overflow-y-auto">
                {uncategorized.map((tx) => (
                  <TxRow
                    key={tx.id}
                    tx={tx}
                    checked={toAdd.has(tx.id)}
                    onToggle={() => toggleId(setToAdd, tx.id)}
                  />
                ))}
              </div>
            )}
          </section>

          <div className="flex justify-end pt-1">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
