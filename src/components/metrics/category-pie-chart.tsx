'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface CategoryData {
  name: string
  value: number
  fill: string
  currency?: string
}

interface CategoryPieChartProps {
  data: CategoryData[]
  currency: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CategoryPieTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const { name, value, payload: dataPayload } = payload[0]
    return (
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-3 rounded-[var(--radius-lg)] shadow-lg">
        <p className="text-sm font-medium text-[var(--color-text-primary)]" style={{ color: dataPayload.fill }}>
          {name}
        </p>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          {formatCurrency(value, dataPayload.currency)}
        </p>
      </div>
    )
  }
  return null
}

export function CategoryPieChart({ data, currency }: CategoryPieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-[var(--color-text-muted)]">
        No hay datos para mostrar este mes.
      </div>
    )
  }

  const chartData = data.map((entry) => ({ ...entry, currency }))

  return (
    <div className="h-[340px] w-full flex flex-col">
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CategoryPieTooltip />} cursor={{ fill: 'transparent' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1.5">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: entry.fill }}
            />
            <span className="text-xs text-[var(--color-text-secondary)] truncate max-w-[120px]">
              {entry.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
