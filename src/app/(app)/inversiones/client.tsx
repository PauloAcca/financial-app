'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Search,
  Wallet,
  Plus,
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { consolidateByCurrency, type InvestmentPlatform } from '@/lib/investments'
import { InvestmentCard } from '@/components/investments/investment-card'
import { InvestmentValueModal } from '@/components/investments/investment-value-modal'
import { InvestmentContributionModal } from '@/components/investments/investment-contribution-modal'
import { InvestmentDetailModal } from '@/components/investments/investment-detail-modal'
import type { Account } from '@/types/database'

interface InvestmentsClientProps {
  platforms: InvestmentPlatform[]
  accounts: Account[]
  defaultCurrency: string
}

export function InvestmentsClient({
  platforms,
  accounts,
  defaultCurrency,
}: InvestmentsClientProps) {
  const [isHidden, setIsHidden] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Modales
  const [valuePlatform, setValuePlatform] = useState<InvestmentPlatform | null>(null)
  const [contributionPlatform, setContributionPlatform] = useState<InvestmentPlatform | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // La plataforma seleccionada se deriva del listado, así siempre queda sincronizada
  const selectedPlatform = platforms.find((p) => p.account.id === selectedId) ?? null

  // Preferencia de ocultar saldo (compartida con el resto de la app)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hide_balance')
      if (saved !== null) setIsHidden(saved === 'true')
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

  const totals = consolidateByCurrency(platforms)
  const primary = totals.find((t) => t.currency === defaultCurrency) ?? totals[0] ?? null
  const others = totals.filter((t) => t !== primary)

  const filtered = platforms.filter((p) =>
    searchTerm.trim() ? p.account.name.toLowerCase().includes(searchTerm.toLowerCase()) : true
  )

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            Inversiones
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Seguimiento del capital aportado y su valor actual • Actualizá el valor cuando quieras
          </p>
        </div>
        <Link
          href="/accounts"
          className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-[var(--radius-md)] bg-[#8FCBB0] text-[#0A0E14] text-sm font-semibold hover:bg-[#A5D8C3] transition-all cursor-pointer active:translate-y-px shrink-0 select-none"
        >
          <Plus size={16} className="stroke-[2.5]" />
          <span className="hidden sm:inline">Nueva plataforma</span>
        </Link>
      </div>

      {/* Resumen consolidado */}
      {primary && (
        <div className="glass rounded-[var(--radius-lg)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[var(--color-text-secondary)] flex items-center gap-1.5">
                <TrendingUp size={15} className="stroke-[2] text-[var(--color-investment)]" />
                Patrimonio invertido ({primary.currency})
              </span>
              <button
                onClick={toggleHide}
                aria-label={isHidden ? 'Mostrar saldo' : 'Ocultar saldo'}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] p-1 rounded-full hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer"
                title={isHidden ? 'Mostrar saldo' : 'Ocultar saldo'}
              >
                {isHidden ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-[var(--radius-full)] bg-[var(--color-investment-subtle)] text-[var(--color-investment)] text-xs font-medium">
              {platforms.length} {platforms.length === 1 ? 'plataforma' : 'plataformas'}
            </span>
          </div>

          <div className="font-display text-2xl sm:text-3xl font-semibold tracking-tight mb-4 tabular-nums select-none text-[var(--color-text-primary)]">
            {isHidden ? '••••••••' : formatCurrency(primary.value, primary.currency)}
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-[rgba(255,255,255,0.06)]">
            <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-[var(--radius-md)] p-3">
              <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                Capital aportado
              </p>
              <p className="text-base font-semibold text-[var(--color-transfer)] tabular-nums mt-1">
                {isHidden ? '••••' : formatCurrency(primary.capital, primary.currency)}
              </p>
            </div>
            <div
              className={cn(
                'bg-[rgba(255,255,255,0.04)] border rounded-[var(--radius-md)] p-3',
                primary.gain >= 0
                  ? 'border-[rgba(127,217,164,0.35)]'
                  : 'border-[rgba(227,160,170,0.35)]'
              )}
            >
              <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                Ganancia / pérdida
              </p>
              <p
                className={cn(
                  'text-base font-semibold tabular-nums mt-1 flex items-center gap-1.5 flex-wrap',
                  primary.gain >= 0
                    ? 'text-[var(--color-income)]'
                    : 'text-[var(--color-expense)]'
                )}
              >
                {primary.gain >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                <span>
                  {isHidden
                    ? '••••'
                    : `${primary.gain >= 0 ? '+' : ''}${formatCurrency(primary.gain, primary.currency)}`}
                </span>
                {primary.gainPct !== null && !isHidden && (
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
                      primary.gainPct >= 0
                        ? 'bg-[var(--color-income-subtle)] text-[var(--color-income)]'
                        : 'bg-[var(--color-expense-subtle)] text-[var(--color-expense)]'
                    )}
                  >
                    {primary.gainPct >= 0 ? '+' : ''}
                    {primary.gainPct.toFixed(2)}%
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Otras monedas */}
          {others.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)] flex flex-col gap-1.5">
              {others.map((t) => (
                <div key={t.currency} className="flex items-center justify-between text-xs">
                  <span className="text-[var(--color-text-secondary)]">{t.currency}</span>
                  <span className="text-[var(--color-text-primary)] tabular-nums flex items-center gap-2">
                    {isHidden ? '••••' : formatCurrency(t.value, t.currency)}
                    {!isHidden && t.gainPct !== null && (
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[0.6875rem] font-medium tabular-nums',
                          t.gain >= 0
                            ? 'bg-[var(--color-income-subtle)] text-[var(--color-income)]'
                            : 'bg-[var(--color-expense-subtle)] text-[var(--color-expense)]'
                        )}
                      >
                        {t.gainPct >= 0 ? '+' : ''}
                        {t.gainPct.toFixed(2)}%
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Buscador */}
      {platforms.length > 0 && (
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar plataforma…"
            className="input-base pl-9"
          />
        </div>
      )}

      {/* Lista de plataformas */}
      {platforms.length === 0 ? (
        <div className="glass rounded-[var(--radius-lg)] flex flex-col items-center justify-center py-16 px-4 gap-3 text-center">
          <div className="w-14 h-14 rounded-[var(--radius-full)] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[var(--color-text-muted)]">
            <Wallet size={26} />
          </div>
          <div>
            <p className="font-medium text-[var(--color-text-primary)] text-sm">
              No tenés inversiones registradas
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 max-w-xs">
              Creá una cuenta de tipo “Inversión” (broker, billetera, plazo fijo) y después cargá sus
              aportes y el valor actual para ver tu ganancia.
            </p>
          </div>
          <Link
            href="/accounts"
            className="mt-2 inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-[var(--radius-md)] bg-[#8FCBB0] text-[#0A0E14] text-sm font-semibold hover:bg-[#A5D8C3] transition-all cursor-pointer active:translate-y-px select-none"
          >
            <Plus size={16} />
            <span>Crear cuenta de inversión</span>
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-[var(--radius-lg)] p-8 text-center">
          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            Sin resultados para “{searchTerm}”
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((platform) => (
            <InvestmentCard
              key={platform.account.id}
              platform={platform}
              hidden={isHidden}
              onSelect={(p) => setSelectedId(p.account.id)}
              onUpdateValue={(p) => setValuePlatform(p)}
              onContribute={(p) => setContributionPlatform(p)}
            />
          ))}
        </div>
      )}

      {/* Modales */}
      <InvestmentValueModal
        key={`value-${valuePlatform?.account.id ?? 'closed'}`}
        open={!!valuePlatform}
        onClose={() => setValuePlatform(null)}
        platform={valuePlatform}
      />

      <InvestmentContributionModal
        key={`contribution-${contributionPlatform?.account.id ?? 'closed'}`}
        open={!!contributionPlatform}
        onClose={() => setContributionPlatform(null)}
        platform={contributionPlatform}
        accounts={accounts}
      />

      <InvestmentDetailModal
        open={!!selectedPlatform}
        onClose={() => setSelectedId(null)}
        platform={selectedPlatform}
        onUpdateValue={(p) => setValuePlatform(p)}
        onContribute={(p) => setContributionPlatform(p)}
      />
    </div>
  )
}
