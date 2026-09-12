'use client'

import { formatCurrency } from '@/lib/utils'

export interface TopCategoryItem {
  name: string
  value: number
  fill: string
  pct: number
}

interface TopCategoriesProps {
  items: TopCategoryItem[]
  currency: string
}

export function TopCategories({ items, currency }: TopCategoriesProps) {
  if (items.length === 0) {
    return (
      <p className="text-xs text-[var(--color-text-muted)] py-6 text-center">
        No hay gastos este mes.
      </p>
    )
  }

  const max = Math.max(...items.map((i) => i.value), 1)

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => (
        <div key={item.name} className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] font-bold text-[#5d6786] tabular-nums w-4 shrink-0">
                {index + 1}
              </span>
              <span className="text-[#8B92A9] font-mono truncate">{item.name}</span>
            </span>
            <span className="flex items-center gap-2 shrink-0">
              <span className="font-bold text-white tabular-nums">
                {formatCurrency(item.value, currency)}
              </span>
              <span className="text-[#5d6786] tabular-nums w-9 text-right">
                {item.pct.toFixed(1)}%
              </span>
            </span>
          </div>
          <div className="h-1.5 rounded-[1px] bg-[#20253f] overflow-hidden">
            <div
              className="h-full rounded-[1px] transition-all"
              style={{
                width: `${Math.max((item.value / max) * 100, 2)}%`,
                backgroundColor: item.fill,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
