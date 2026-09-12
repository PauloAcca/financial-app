'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, History, CalendarDays } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { getCategoryHistory, type CategoryHistoryItem } from '@/actions/categories'

export interface CategoryHistoryTarget {
  id: string
  name: string
  color?: string | null
}

interface CategoryHistoryModalProps {
  open: boolean
  onClose: () => void
  category: CategoryHistoryTarget | null
}

function periodLabel(period: string): string {
  const [year, month] = period.split('-').map(Number)
  const label = new Date(year, month - 1, 1).toLocaleString('es-AR', {
    month: 'long',
    year: 'numeric',
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function CategoryHistoryModal({ open, onClose, category }: CategoryHistoryModalProps) {
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<CategoryHistoryItem[]>([])
  const [monthFilter, setMonthFilter] = useState<string>('all')

  useEffect(() => {
    if (!open || !category) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setMonthFilter('all')
      const res = await getCategoryHistory(category!.id)
      if (cancelled) return
      setItems(res.success ? res.data : [])
      setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [open, category])

  // Meses disponibles (derivados de las transacciones)
  const months = useMemo(() => {
    const set = new Set(items.map((tx) => tx.occurred_at.slice(0, 7)))
    return Array.from(set).sort((a, b) => b.localeCompare(a))
  }, [items])

  const filtered = useMemo(
    () => (monthFilter === 'all' ? items : items.filter((tx) => tx.occurred_at.slice(0, 7) === monthFilter)),
    [items, monthFilter]
  )

  const totalsByCurrency = useMemo(() => {
    return filtered.reduce<Record<string, number>>((acc, tx) => {
      acc[tx.currency] = (acc[tx.currency] ?? 0) + Number(tx.amount)
      return acc
    }, {})
  }, [filtered])

  const kind = filtered[0]?.type

  if (!category) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Historial de categoría"
      description={category.name}
      size="lg"
    >
      {loading ? (
        <div className="flex items-center justify-center py-10 text-[#8B92A9]">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Filtro por mes + resumen */}
          <div className="flex items-end justify-between gap-3">
            <div className="w-48">
              <Select
                id="category-history-month"
                label="Filtrar por mes"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Todos los meses' },
                  ...months.map((m) => ({ value: m, label: periodLabel(m) })),
                ]}
              />
            </div>

            <div className="flex flex-col items-end gap-0.5 pb-1">
              <span className="text-[10px] uppercase tracking-widest text-[#8B92A9]">
                {filtered.length} movimiento{filtered.length !== 1 ? 's' : ''}
              </span>
              {Object.entries(totalsByCurrency).map(([currency, total]) => (
                <span
                  key={currency}
                  className={cn(
                    'text-sm font-bold tabular-nums',
                    kind === 'income' ? 'text-[#00FF66]' : 'text-[#ff4d6d]'
                  )}
                >
                  {kind === 'income' ? '+' : '−'} {formatCurrency(total, currency)}
                </span>
              ))}
            </div>
          </div>

          {/* Lista */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-[#5d6786]">
              <History size={22} />
              <p className="text-xs">
                {items.length === 0
                  ? 'Esta categoría todavía no tiene movimientos.'
                  : 'No hay movimientos en el mes seleccionado.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1 max-h-[55vh] overflow-y-auto pr-1">
              {filtered.map((tx) => {
                const isIncome = tx.type === 'income'
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-[4px] bg-[#14182b] border border-[#1e233f]"
                  >
                    <div className="min-w-0">
                      <p className="text-xs text-white truncate">
                        {tx.description || 'Sin descripción'}
                      </p>
                      <p className="text-[10px] text-[#8B92A9] truncate flex items-center gap-1">
                        <CalendarDays size={10} className="shrink-0" />
                        {formatDate(tx.occurred_at, 'short')}
                        {tx.account?.name ? ` · ${tx.account.name}` : ''}
                        {tx.category?.name ? ` · ${tx.category.name}` : ''}
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
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
