'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { UserGameStats } from '@/lib/gamification'
import { DEFAULT_CURRENCY } from '@/lib/constants'

interface SummaryCardsProps {
  stats: UserGameStats
  currency?: string
}

export function SummaryCards({ stats, currency = DEFAULT_CURRENCY }: SummaryCardsProps) {
  const [isHidden, setIsHidden] = useState(false)

  // Cargar preferencia de ocultar saldo
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hide_balance')
      if (saved !== null) {
        setIsHidden(saved === 'true')
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  function toggleHide() {
    const next = !isHidden
    setIsHidden(next)
    try {
      localStorage.setItem('hide_balance', String(next))
    } catch (e) {
      console.error(e)
    }
  }

  // Saldo total real
  const balance = stats.totalBalance

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Saldo total */}
      <div className="glass rounded-[var(--radius-lg)] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">
              Saldo total
            </span>

            {/* Ocultar / mostrar saldo */}
            <button
              onClick={toggleHide}
              aria-label={isHidden ? 'Mostrar saldo' : 'Ocultar saldo'}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] p-1 rounded-full hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer"
              title={isHidden ? 'Mostrar saldo' : 'Ocultar saldo'}
            >
              {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {/* Nivel — sutil */}
          <span className="inline-flex items-center px-2.5 py-1 rounded-[var(--radius-full)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)] text-xs font-medium">
            Nivel {stats.level}
          </span>
        </div>

        {/* Monto principal */}
        <div className="font-display text-[2rem] sm:text-[2.25rem] font-semibold tracking-tight text-[var(--color-text-primary)] mb-5 tabular-nums select-none">
          {isHidden ? '••••••••' : formatCurrency(balance, currency)}
        </div>

        {/* Progreso de nivel — barra fina y continua */}
        <div className="flex flex-col gap-2">
          <div className="h-1.5 w-full rounded-[var(--radius-full)] bg-[rgba(255,255,255,0.06)] overflow-hidden">
            <div
              className="h-full rounded-[var(--radius-full)] bg-[var(--color-accent)] transition-all duration-700"
              style={{ width: `${Math.max(2, stats.progressPercent)}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[0.6875rem] text-[var(--color-text-muted)]">
              {stats.currentXP.toLocaleString('es-AR')} / {stats.nextLevelXP.toLocaleString('es-AR')} XP
            </p>
            <p className="text-[0.6875rem] text-[var(--color-text-muted)]">
              {stats.rank}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Gastado hoy */}
      <div className="glass rounded-[var(--radius-lg)] p-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">
              Gastado hoy
            </span>
            <span className="text-xl font-semibold text-[var(--color-text-primary)] tabular-nums mt-1">
              {isHidden ? '••••' : formatCurrency(stats.todayExpense, currency)}
            </span>
          </div>

          <span className="text-xs text-[var(--color-text-muted)]">
            {stats.todayTxCount === 0
              ? 'Sin movimientos'
              : `${stats.todayTxCount} ${stats.todayTxCount === 1 ? 'movimiento' : 'movimientos'}`}
          </span>
        </div>
      </div>
    </div>
  )
}
