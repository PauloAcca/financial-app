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
        'flex items-center gap-3 px-3 py-2 rounded-[4px] cursor-pointer transition-colors',
        checked ? 'bg-[#00FF66]/10 border border-[#00FF66]/30' : 'hover:bg-[#20253f] border border-transparent'
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="accent-[#00FF66] cursor-pointer shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white truncate">{tx.description || 'Sin descripción'}</p>
        <p className="text-[10px] text-[#8B92A9] truncate">
          {formatDate(tx.occurred_at, 'short')}
          {tx.account?.name ? ` · ${tx.account.name}` : ''}
        </p>
      </div>
      <span
        className={cn(
          'text-xs font-bold tabular-nums shrink-0',
          isIncome ? 'text-[#00FF66]' : 'text-white'
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
        <div className="flex items-center justify-center py-10 text-[#8B92A9]">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-5 max-h-[65vh] overflow-y-auto pr-1">
          {/* Movimientos actuales de la categoría */}
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8B92A9]">
                En esta categoría ({inCategory.length})
              </h3>
              <button
                type="button"
                onClick={handleRemove}
                disabled={toRemove.size === 0 || isPending}
                className={cn(
                  'flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-[4px] border transition-colors cursor-pointer',
                  toRemove.size === 0
                    ? 'border-[#293056] text-[#5d6786] cursor-not-allowed'
                    : 'border-[#ff4d6d]/40 text-[#ff4d6d] hover:bg-[#ff4d6d]/15'
                )}
              >
                <Minus size={12} /> Quitar seleccionados
              </button>
            </div>
            {inCategory.length === 0 ? (
              <p className="text-xs text-[#5d6786] py-3 text-center">
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
          <section className="flex flex-col gap-2 border-t border-[#1e233f] pt-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8B92A9]">
                Sin categoría ({uncategorized.length})
              </h3>
              <button
                type="button"
                onClick={handleAdd}
                disabled={toAdd.size === 0 || isPending}
                className={cn(
                  'flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-[4px] border transition-colors cursor-pointer',
                  toAdd.size === 0
                    ? 'border-[#293056] text-[#5d6786] cursor-not-allowed'
                    : 'border-[#00FF66]/40 text-[#00FF66] hover:bg-[#00FF66]/15'
                )}
              >
                <Plus size={12} /> Agregar seleccionados
              </button>
            </div>
            {uncategorized.length === 0 ? (
              <p className="text-xs text-[#5d6786] py-3 text-center">
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
