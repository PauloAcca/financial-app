'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface MonthlyData {
  month: string
  income: number
  expense: number
  currency?: string
}

interface MonthlyBarChartProps {
  data: MonthlyData[]
  currency: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MonthlyBarTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const currency = payload[0]?.payload?.currency ?? 'ARS'
    return (
      <div className="bg-[rgba(20,25,32,0.85)] backdrop-blur-md border border-[rgba(255,255,255,0.12)] p-3 rounded-[12px] shadow-[var(--shadow-lg)] min-w-[150px]">
        <p className="text-sm font-semibold mb-2 text-[var(--color-text-primary)] capitalize">{label}</p>
        {payload.map((entry: { color?: string; name?: string; value?: number }, index: number) => (
          <div key={`item-${index}`} className="flex justify-between items-center text-sm mb-1">
            <span style={{ color: entry.color }}>
              {entry.name === 'income' ? 'Ingresos' : 'Gastos'}
            </span>
            <span className="font-medium text-[var(--color-text-primary)] ml-3">
              {formatCurrency(Number(entry.value), currency)}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function MonthlyBarChart({ data, currency }: MonthlyBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-[var(--color-text-muted)]">
        No hay datos para mostrar.
      </div>
    )
  }

  const chartData = data.map((entry) => ({ ...entry, currency }))

  return (
    <div className="h-[320px] w-full flex flex-col">
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
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
              content={<MonthlyBarTooltip />}
              cursor={{ fill: 'rgba(255,255,255,0.06)' }}
            />
            <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-1 flex justify-end gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-income)]" />
          <span className="text-xs text-[var(--color-text-secondary)]">Ingresos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-expense)]" />
          <span className="text-xs text-[var(--color-text-secondary)]">Gastos</span>
        </div>
      </div>
    </div>
  )
}
