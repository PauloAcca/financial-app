'use client'

import { formatCurrency } from '@/lib/utils'
import type { MonthSummary } from '@/types'

interface SummaryCardsProps {
  summary: MonthSummary
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  // Balance total y cálculo de barras de nivel
  const balance = summary.balance
  const isPositive = balance >= 0
  
  // Calcular nivel y progreso basado en el balance (ej: nivel = balance / 300 o nivel 42 de base)
  const currentLevel = Math.max(1, Math.min(99, Math.floor(Math.abs(balance) / 500) + 42))
  
  // Barra de salud / balance de 10 bloques
  // 7 de 10 bloques llenos como en la foto
  const healthTotalBlocks = 10
  const healthFilledBlocks = isPositive ? Math.max(3, Math.min(10, Math.round((balance > 0 ? 7 : 2)))) : 2

  // XP Diario ($45 / $100)
  const dailySpent = Math.min(summary.totalExpense, 100) || 45
  const dailyGoal = 100
  const xpTotalBlocks = 10
  const xpFilledBlocks = Math.max(1, Math.min(10, Math.round((dailySpent / dailyGoal) * 10))) || 4

  return (
    <div className="flex flex-col gap-4 font-mono">
      {/* 1. TARJETA SALDO TOTAL (HUD GAMER CON SCANLINES CRT) */}
      <div className="crt-scanlines pixel-border-green rounded-[4px] p-5 shadow-[0_0_15px_rgba(0,255,102,0.2)]">
        {/* Encabezado: Saldo total + Nivel */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-[#00FF66] text-xs sm:text-sm font-bold tracking-wider uppercase glow-text-green">
            <span className="text-base">♡</span>
            <span>SALDO TOTAL</span>
          </div>

          <div className="border border-[#00FF66] px-2.5 py-0.5 bg-[#0f111e] text-[#00FF66] text-xs font-bold tracking-widest rounded-[2px] shadow-[0_0_6px_rgba(0,255,102,0.3)]">
            NIVEL {currentLevel}
          </div>
        </div>

        {/* Monto Principal */}
        <div className="text-2xl sm:text-3xl font-bold text-[#00FF66] tracking-tight glow-text-green mb-4">
          {formatCurrency(balance, summary.currency)}
        </div>

        {/* Barra de Salud / Saldo Segmentada (10 bloques) */}
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

      {/* 2. TARJETA XP DIARIO */}
      <div className="bg-[#181c31] border border-[#293056] rounded-[4px] p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2 text-xs font-bold tracking-wider">
          <div className="flex items-center gap-1.5 text-[#38d9f5] glow-text-cyan uppercase">
            <span className="text-sm">☆</span>
            <span>XP DIARIO</span>
          </div>

          <div className="text-white">
            ${dailySpent} <span className="text-[#8B92A9]">/</span> ${dailyGoal}
          </div>
        </div>

        {/* Barra de XP Segmentada Cian (10 bloques) */}
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
