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
    <div className="flex flex-col gap-5 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide uppercase">
            INVERSIONES
          </h1>
          <p className="text-xs text-[#8B92A9] mt-0.5">
            Seguimiento del capital aportado y su valor actual • Actualizá el valor cuando quieras
          </p>
        </div>
        <Link
          href="/accounts"
          className="btn-arcade-green py-2 px-3.5 rounded-[4px] text-xs font-bold text-black flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
        >
          <Plus size={16} className="stroke-[3]" />
          <span className="hidden sm:inline">Nueva plataforma</span>
        </Link>
      </div>

      {/* HUD consolidado */}
      {primary && (
        <div className="crt-scanlines pixel-border-green rounded-[4px] p-5 shadow-[0_0_15px_rgba(0,255,102,0.15)] relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[#00FF66] text-xs sm:text-sm font-bold tracking-wider uppercase glow-text-green flex items-center gap-1.5">
                <TrendingUp size={16} />
                <span>PATRIMONIO INVERTIDO ({primary.currency})</span>
              </span>
              <button
                onClick={toggleHide}
                aria-label={isHidden ? 'Mostrar saldo' : 'Ocultar saldo'}
                className="text-[#00FF66]/70 hover:text-[#00FF66] p-1 rounded hover:bg-[#00FF66]/10 transition-colors cursor-pointer"
              >
                {isHidden ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <div className="border border-[#00FF66] px-2.5 py-0.5 bg-[#0f111e] text-[#00FF66] text-xs font-bold tracking-widest rounded-[2px]">
              {platforms.length} {platforms.length === 1 ? 'PLATAFORMA' : 'PLATAFORMAS'}
            </div>
          </div>

          <div
            className={cn(
              'text-2xl sm:text-3xl font-bold tracking-tight mb-4 tabular-nums select-none',
              primary.gain >= 0 ? 'text-[#00FF66] glow-text-green' : 'text-[#ff4d6d] glow-text-pink'
            )}
          >
            {isHidden ? '••••••••' : formatCurrency(primary.value, primary.currency)}
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[#293056]">
            <div className="bg-[#14182b] border border-[#293056] rounded-[4px] p-3">
              <p className="text-[10px] font-bold text-[#8B92A9] uppercase">CAPITAL APORTADO</p>
              <p className="text-base font-bold text-[#38d9f5] tabular-nums mt-1">
                {isHidden ? '••••' : formatCurrency(primary.capital, primary.currency)}
              </p>
            </div>
            <div
              className={cn(
                'bg-[#14182b] border rounded-[4px] p-3',
                primary.gain >= 0 ? 'border-[#00FF66]/30' : 'border-[#ff4d6d]/30'
              )}
            >
              <p className="text-[10px] font-bold text-[#8B92A9] uppercase">GANANCIA / PÉRDIDA</p>
              <p
                className={cn(
                  'text-base font-bold tabular-nums mt-1 flex items-center gap-1.5',
                  primary.gain >= 0 ? 'text-[#00FF66]' : 'text-[#ff4d6d]'
                )}
              >
                {primary.gain >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                <span>
                  {isHidden
                    ? '••••'
                    : `${primary.gain >= 0 ? '+' : ''}${formatCurrency(primary.gain, primary.currency)}`}
                  {primary.gainPct !== null && !isHidden && (
                    <span className="ml-1 text-sm">
                      ({primary.gainPct >= 0 ? '+' : ''}
                      {primary.gainPct.toFixed(2)}%)
                    </span>
                  )}
                </span>
              </p>
            </div>
          </div>

          {/* Otras monedas */}
          {others.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[#293056] flex flex-col gap-1.5">
              {others.map((t) => (
                <div key={t.currency} className="flex items-center justify-between text-xs">
                  <span className="text-[#8B92A9] font-bold">{t.currency}</span>
                  <span className="text-white tabular-nums">
                    {isHidden ? '••••' : formatCurrency(t.value, t.currency)}
                    <span
                      className={cn(
                        'ml-2',
                        t.gain >= 0 ? 'text-[#00FF66]' : 'text-[#ff4d6d]'
                      )}
                    >
                      {!isHidden && t.gainPct !== null && (
                        <>
                          {t.gainPct >= 0 ? '+' : ''}
                          {t.gainPct.toFixed(2)}%
                        </>
                      )}
                    </span>
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
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5d6786]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar plataforma..."
            className="w-full pl-9 pr-4 py-2 bg-[#181c31] border border-[#293056] rounded-[4px] text-xs text-white placeholder-[#5d6786] focus:border-[#00FF66] focus:outline-none transition-colors"
          />
        </div>
      )}

      {/* Lista de plataformas */}
      {platforms.length === 0 ? (
        <div className="bg-[#181c31] border border-[#293056] rounded-[4px] flex flex-col items-center justify-center py-16 px-4 gap-3 text-center">
          <div className="w-14 h-14 rounded-[4px] bg-[#14182b] border border-[#293056] flex items-center justify-center text-[#5d6786]">
            <Wallet size={28} />
          </div>
          <div>
            <p className="font-bold text-white text-sm uppercase tracking-wide">
              NO TENÉS INVERSIONES REGISTRADAS
            </p>
            <p className="text-xs text-[#8B92A9] mt-1 max-w-xs">
              Creá una cuenta de tipo “Inversión” (broker, billetera, plazo fijo) y después cargá sus
              aportes y el valor actual para ver tu ganancia.
            </p>
          </div>
          <Link
            href="/accounts"
            className="btn-arcade-green mt-2 py-2 px-3.5 rounded-[4px] text-xs font-bold text-black flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus size={15} />
            <span>CREAR CUENTA DE INVERSIÓN</span>
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#181c31] border border-[#293056] rounded-[4px] p-8 text-center">
          <p className="text-xs font-bold text-white uppercase">Sin resultados para “{searchTerm}”</p>
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
