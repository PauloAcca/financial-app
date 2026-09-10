'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface MonthlyData {
  month: string
  income: number
  expense: number
}

interface MonthlyBarChartProps {
  data: MonthlyData[]
  currency: string
}

export function MonthlyBarChart({ data, currency }: MonthlyBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-[var(--color-text-muted)]">
        No hay datos para mostrar.
      </div>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-3 rounded-[var(--radius-lg)] shadow-lg min-w-[150px]">
          <p className="text-sm font-semibold mb-2 text-[var(--color-text-primary)] capitalize">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex justify-between items-center text-sm mb-1">
              <span style={{ color: entry.color }}>
                {entry.name === 'income' ? 'Ingresos' : 'Gastos'}
              </span>
              <span className="font-medium text-[var(--color-text-primary)] ml-3">
                {formatCurrency(entry.value, currency)}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-[320px] w-full flex flex-col">
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
              dy={10}
              tickFormatter={(val) => val.substring(0, 3)} // Ene, Feb...
            />
            <YAxis
              hide // Ocultamos el eje Y para diseño más limpio
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'var(--color-surface-3)', opacity: 0.4 }}
            />
            <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-1 flex justify-end gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
          <span className="text-xs text-[var(--color-text-secondary)]">Ingresos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
          <span className="text-xs text-[var(--color-text-secondary)]">Gastos</span>
        </div>
      </div>
    </div>
  )
}
