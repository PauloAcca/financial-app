'use client'

import { useEffect, useState, useTransition } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  getCategoryTransactions,
  deleteCategory,
  type CategoryTransactionItem,
} from '@/actions/categories'
import type { Category } from '@/types/database'

interface DeleteCategoryModalProps {
  open: boolean
  onClose: () => void
  category: Category | null
  categories: Category[]
  onDeleted?: () => void
}

export function DeleteCategoryModal({
  open,
  onClose,
  category,
  categories,
  onDeleted,
}: DeleteCategoryModalProps) {
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState<CategoryTransactionItem[]>([])
  const [reassignTo, setReassignTo] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !category) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      setReassignTo('')
      const res = await getCategoryTransactions(category!.id)
      if (cancelled) return
      setTransactions(res.success ? res.data : [])
      setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [open, category])

  function handleConfirm() {
    if (!category) return
    setError(null)

    startTransition(async () => {
      const res = await deleteCategory(category.id, reassignTo || undefined)
      if (res.success) {
        toast.success(
          transactions.length > 0 && !reassignTo
            ? 'Categoría eliminada. Los movimientos quedaron sin categoría.'
            : 'Categoría eliminada.'
        )
        onDeleted?.()
        onClose()
      } else {
        setError(res.error)
      }
    })
  }

  if (!category) return null

  // Categorías candidatas del mismo tipo para reasignar (excluye la que se elimina)
  const reassignOptions = [
    { value: '', label: 'Dejar sin categoría' },
    ...categories
      .filter((c) => c.kind === category.kind && c.id !== category.id)
      .map((c) => ({ value: c.id, label: c.name })),
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Eliminar categoría"
      description={category.name}
      size="lg"
    >
      {loading ? (
        <div className="flex items-center justify-center py-10 text-[#8B92A9]">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {error && (
            <div className="px-4 py-3 rounded-[4px] bg-[#ff4d6d]/15 border border-[#ff4d6d]/40">
              <p className="text-xs text-[#ff4d6d] font-bold">{error}</p>
            </div>
          )}

          <div className="flex gap-2 px-3 py-3 rounded-[4px] bg-amber-500/10 border border-amber-500/30">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" />
            <div className="text-xs text-amber-400">
              {transactions.length === 0 ? (
                <span>Esta categoría no tiene movimientos. Se va a eliminar sin afectar transacciones.</span>
              ) : (
                <span>
                  Esta categoría tiene <strong>{transactions.length}</strong> movimiento
                  {transactions.length !== 1 ? 's' : ''}. Elegí a dónde moverlos antes de eliminarla.
                </span>
              )}
            </div>
          </div>

          {transactions.length > 0 && (
            <>
              <div className="flex flex-col gap-1 max-h-52 overflow-y-auto border border-[#293056] rounded-[4px] p-1">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-[4px] hover:bg-[#20253f]"
                  >
                    <div className="min-w-0">
                      <p className="text-xs text-white truncate">
                        {tx.description || 'Sin descripción'}
                      </p>
                      <p className="text-[10px] text-[#8B92A9] truncate">
                        {formatDate(tx.occurred_at, 'short')}
                        {tx.account?.name ? ` · ${tx.account.name}` : ''}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-white tabular-nums shrink-0">
                      {formatCurrency(Number(tx.amount), tx.currency)}
                    </span>
                  </div>
                ))}
              </div>

              <Select
                id="delete-category-reassign"
                label="Mover movimientos a"
                value={reassignTo}
                onChange={(e) => setReassignTo(e.target.value)}
                options={reassignOptions}
              />
            </>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              loading={isPending}
              className="bg-[#ff4d6d] text-white hover:bg-[#e63d5c]"
            >
              Eliminar categoría
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
