'use client'

import { formatCurrency } from '@/lib/utils'
import type { UserGameStats } from '@/lib/gamification'

interface SummaryCardsProps {
  stats: UserGameStats
  currency?: string
}

export function SummaryCards({ stats, currency = 'USD' }: SummaryCardsProps) {
  // Saldo total real
  const balance = stats.totalBalance
  
  // Barra de salud / balance de 10 bloques (100% real)
  // Si el balance es 0 o negativo, 0 bloques. Si tiene saldo, se calcula en base a meta de $1000 (o escala)
  const healthTotalBlocks = 10
  const healthFilledBlocks = balance > 0 
    ? Math.min(10, Math.max(1, Math.round((balance / 1000) * 10))) 
    : 0

  // Barra de XP Diario (100% real en base a los gastos de hoy)
  const xpTotalBlocks = 10
  const xpFilledBlocks = stats.todayExpense > 0 
    ? Math.min(10, Math.max(1, Math.round((stats.todayExpense / stats.dailyGoal) * 10))) 
    : 0

  return (
    <div className="flex flex-col gap-4 font-mono">
      {/* 1. TARJETA SALDO TOTAL (HUD GAMER CON SCANLINES CRT) */}
      <div className="crt-scanlines pixel-border-green rounded-[4px] p-5 shadow-[0_0_15px_rgba(0,255,102,0.2)]">
        {/* Encabezado: Saldo total + Nivel REAL */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-[#00FF66] text-xs sm:text-sm font-bold tracking-wider uppercase glow-text-green">
            <span className="text-base">♡</span>
            <span>SALDO TOTAL</span>
          </div>

          <div className="border border-[#00FF66] px-2.5 py-0.5 bg-[#0f111e] text-[#00FF66] text-xs font-bold tracking-widest rounded-[2px] shadow-[0_0_6px_rgba(0,255,102,0.3)]">
            NIVEL {stats.level}
          </div>
        </div>

        {/* Monto Principal REAL */}
        <div className="text-2xl sm:text-3xl font-bold text-[#00FF66] tracking-tight glow-text-green mb-4 tabular-nums">
          {formatCurrency(balance, currency)}
        </div>

        {/* Barra de Salud / Saldo Segmentada REAL (10 bloques) */}
        <div className="grid grid-cols-10 gap-1.5 h-3.5 w-full">
          {Array.from({ length: healthTotalBlocks }).map((_, index) => {
            const isFilled = index < healthFilledBlocks
            return (
              <div
                key={`health-block-${index}`}
                className={`h-full rounded-[1px] transition-all duration-300 ${
                  isFilled
                    ? 'bg-[#00FF66] shadow-[0_0_6px_rgba(0,255,102,0.6)]'
                    : 'bg-[#20253f] border border-[#293056]'
                }`}
              />
            )
          })}
        </div>
      </div>

      {/* 2. TARJETA XP DIARIO REAL */}
      <div className="bg-[#181c31] border border-[#293056] rounded-[4px] p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2 text-xs font-bold tracking-wider">
          <div className="flex items-center gap-1.5 text-[#38d9f5] glow-text-cyan uppercase">
            <span className="text-sm">☆</span>
            <span>XP DIARIO</span>
          </div>

          <div className="text-white tabular-nums">
            ${stats.todayExpense.toLocaleString('es-AR')} <span className="text-[#8B92A9]">/</span> ${stats.dailyGoal.toLocaleString('es-AR')}
          </div>
        </div>

        {/* Barra de XP Segmentada Cian REAL (10 bloques) */}
        <div className="grid grid-cols-10 gap-1.5 h-2.5 w-full">
          {Array.from({ length: xpTotalBlocks }).map((_, index) => {
            const isFilled = index < xpFilledBlocks
            return (
              <div
                key={`xp-block-${index}`}
                className={`h-full rounded-[1px] transition-all duration-300 ${
                  isFilled
                    ? 'bg-[#38d9f5] shadow-[0_0_6px_rgba(56,217,245,0.6)]'
                    : 'bg-[#20253f]'
                }`}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
