'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface CategoryData {
  name: string
  value: number
  fill: string
}

interface CategoryPieChartProps {
  data: CategoryData[]
  currency: string
}

export function CategoryPieChart({ data, currency }: CategoryPieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-[var(--color-text-muted)]">
        No hay datos para mostrar este mes.
      </div>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const { name, value, payload: dataPayload } = payload[0]
      return (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-3 rounded-[var(--radius-lg)] shadow-lg">
          <p className="text-sm font-medium text-[var(--color-text-primary)]" style={{ color: dataPayload.fill }}>
            {name}
          </p>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {formatCurrency(value, currency)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle"
            formatter={(value) => <span className="text-xs text-[var(--color-text-secondary)] ml-1">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
