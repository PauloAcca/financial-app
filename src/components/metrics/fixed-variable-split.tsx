'use client'

import { formatCurrency } from '@/lib/utils'

interface FixedVariableSplitProps {
  fixed: number
  variable: number
  currency: string
}

export function FixedVariableSplit({ fixed, variable, currency }: FixedVariableSplitProps) {
  const total = fixed + variable
  const fixedPct = total > 0 ? (fixed / total) * 100 : 0
  const variablePct = total > 0 ? (variable / total) * 100 : 0

  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-3 w-full rounded-[2px] overflow-hidden bg-[#20253f]">
        <div
          className="h-full bg-[#38d9f5] transition-all"
          style={{ width: `${fixedPct}%` }}
        />
        <div
          className="h-full bg-[#fbc02d] transition-all"
          style={{ width: `${variablePct}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#8B92A9]">
            <span className="w-2 h-2 rounded-full bg-[#38d9f5]" />
            Fijos
          </span>
          <span className="text-sm font-bold text-white tabular-nums">
            {formatCurrency(fixed, currency)}
          </span>
          <span className="text-[10px] text-[#5d6786]">{fixedPct.toFixed(1)}% del gasto</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#8B92A9]">
            <span className="w-2 h-2 rounded-full bg-[#fbc02d]" />
            Variables
          </span>
          <span className="text-sm font-bold text-white tabular-nums">
            {formatCurrency(variable, currency)}
          </span>
          <span className="text-[10px] text-[#5d6786]">{variablePct.toFixed(1)}% del gasto</span>
        </div>
      </div>
    </div>
  )
}
