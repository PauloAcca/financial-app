'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import {
  Trophy,
  PiggyBank,
  Plane,
  ChevronRight,
  Bell,
  Volume2,
  LogOut,
  Wallet,
  Repeat,
  Tag,
  BarChart2,
  History,
  Bot,
  Eye,
  EyeOff,
  HandCoins,
  Shield,
  Coins,
} from 'lucide-react'
import { logout } from '@/actions/auth'
import { cn, formatCurrency } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import type { UserGameStats, Achievement } from '@/lib/gamification'

const SYSTEM_MODULES = [
  {
    href: '/transactions',
    title: 'Historial de movimientos',
    description: 'Registro completo de transacciones y filtros',
    icon: History,
    color: 'var(--color-accent)',
  },
  {
    href: '/accounts',
    title: 'Cuentas',
    description: 'Bancos, billeteras virtuales y brokers',
    icon: Wallet,
    color: 'var(--color-info)',
  },
  {
    href: '/prestamos',
    title: 'Préstamos y deudas',
    description: 'Dinero prestado a terceros y deudas pendientes',
    icon: HandCoins,
    color: 'var(--color-success)',
  },
  {
    href: '/recurring',
    title: 'Gastos fijos y servicios',
    description: 'Suscripciones y débitos recurrentes',
    icon: Repeat,
    color: 'var(--color-investment)',
  },
  {
    href: '/categories',
    title: 'Categorías',
    description: 'Organización de ingresos y gastos',
    icon: Tag,
    color: 'var(--color-warning)',
  },
  {
    href: '/metrics',
    title: 'Métricas y estadísticas',
    description: 'Gráficos de rendimiento financiero',
    icon: BarChart2,
    color: 'var(--color-info)',
  },
  {
    href: '/chat',
    title: 'Asistente IA',
    description: 'Carga por voz e inteligencia artificial',
    icon: Bot,
    color: 'var(--color-danger)',
  },
]

interface ProfileClientProps {
  displayName: string
  currency: string
  stats: UserGameStats
}

function getAchievementIcon(type: Achievement['iconType'], color: string) {
  switch (type) {
    case 'piggy':
      return <PiggyBank size={20} style={{ color }} />
    case 'plane':
      return <Plane size={20} style={{ color }} />
    case 'swords':
      return <History size={20} style={{ color }} />
    case 'shield':
      return <Shield size={20} style={{ color }} />
    case 'coins':
      return <Coins size={20} style={{ color }} />
    case 'trophy':
    default:
      return <Trophy size={20} style={{ color }} />
  }
}

export function ProfileClient({ displayName, currency, stats }: ProfileClientProps) {
  const [isPending, startTransition] = useTransition()
  const [alertsEnabled, setAlertsEnabled] = useState(true)
  const [effectsEnabled, setEffectsEnabled] = useState(false)
  const [isHidden, setIsHidden] = useState(false)

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

  function handleLogout() {
    startTransition(async () => {
      await logout()
    })
  }

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto w-full pb-6">
      {/* 1. TARJETA DE PERFIL */}
      <div className="glass rounded-[var(--radius-lg)] p-5">
        <div className="flex items-center gap-4">
          <Avatar name={displayName} size="xl" />

          <div className="flex-1 min-w-0">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-text-primary)] truncate">
              {displayName}
            </h2>
            <div className="flex items-center gap-2 flex-wrap mt-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-[var(--radius-full)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)] text-xs font-medium">
                Nivel {stats.level}
              </span>
              <span className="text-xs text-[var(--color-text-secondary)]">
                {stats.rank}
              </span>
            </div>
          </div>
        </div>

        {/* Barra de progreso de nivel */}
        <div className="flex flex-col gap-2 mt-5">
          <div className="h-1.5 w-full rounded-[var(--radius-full)] bg-[rgba(255,255,255,0.06)] overflow-hidden">
            <div
              className="h-full rounded-[var(--radius-full)] bg-[var(--color-accent)] transition-all duration-700"
              style={{ width: `${Math.max(2, stats.progressPercent)}%` }}
            />
          </div>
          <p className="text-[0.6875rem] text-[var(--color-text-muted)]">
            {stats.currentXP.toLocaleString('es-AR')} / {stats.nextLevelXP.toLocaleString('es-AR')} XP
          </p>
        </div>
      </div>

      {/* 2. RESUMEN: SALDO Y LOGROS */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Saldo total con toggle de visibilidad */}
        <div className="glass rounded-[var(--radius-lg)] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">
              Saldo total
            </span>
            <button
              onClick={toggleHide}
              aria-label={isHidden ? 'Mostrar saldo' : 'Ocultar saldo'}
              title={isHidden ? 'Mostrar saldo' : 'Ocultar saldo'}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] p-1 rounded-full hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer"
            >
              {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <div className="text-lg sm:text-xl font-semibold text-[var(--color-text-primary)] tracking-tight tabular-nums truncate select-none">
            {isHidden ? '••••••••' : formatCurrency(stats.totalBalance, currency)}
          </div>
        </div>

        {/* Logros completados */}
        <div className="glass rounded-[var(--radius-lg)] p-4">
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">
            Logros
          </span>
          <div className="text-lg sm:text-xl font-semibold text-[var(--color-text-primary)] tracking-tight tabular-nums mt-2">
            {stats.unlockedAchievementsCount}/{stats.totalAchievementsCount}
          </div>
        </div>
      </div>

      {/* 3. MÓDULOS */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-medium text-[var(--color-text-secondary)]">
          Módulos
        </h3>

        <div className="flex flex-col gap-2.5">
          {SYSTEM_MODULES.map((module) => {
            const Icon = module.icon
            return (
              <Link
                key={module.href}
                href={module.href}
                prefetch={true}
                className="glass rounded-[var(--radius-lg)] p-3.5 flex items-center justify-between gap-3 hover:bg-[rgba(255,255,255,0.07)] hover:border-[rgba(143,203,176,0.35)] transition-all cursor-pointer group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] flex items-center justify-center shrink-0">
                    <Icon size={20} style={{ color: module.color }} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-medium text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-accent)] transition-colors">
                      {module.title}
                    </h4>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 truncate">
                      {module.description}
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] group-hover:translate-x-1 transition-all shrink-0" />
              </Link>
            )
          })}
        </div>
      </div>

      {/* 4. LOGROS */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-[var(--color-text-secondary)]">
            Logros
          </h3>
          <span className="text-xs text-[var(--color-text-muted)] tabular-nums">
            {stats.unlockedAchievementsCount}/{stats.totalAchievementsCount}
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {stats.achievements.map((ach) => (
            <div
              key={ach.id}
              className={cn(
                'rounded-[var(--radius-lg)] p-3.5 flex items-center justify-between gap-3',
                ach.unlocked ? 'glass' : 'glass-soft'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] flex items-center justify-center shrink-0">
                  {getAchievementIcon(
                    ach.iconType,
                    ach.unlocked ? ach.color : 'var(--color-text-muted)'
                  )}
                </div>

                <div className="min-w-0">
                  <h4
                    className={cn(
                      'text-sm font-medium truncate',
                      ach.unlocked
                        ? 'text-[var(--color-text-primary)]'
                        : 'text-[var(--color-text-secondary)]'
                    )}
                  >
                    {ach.title}
                  </h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 truncate">
                    {ach.description}
                  </p>
                </div>
              </div>

              {/* Estado / Progreso */}
              <div className="shrink-0 text-right flex flex-col items-end gap-1">
                {ach.unlocked ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-[var(--radius-full)] text-[0.6875rem] font-medium bg-[var(--color-success-subtle)] text-[var(--color-success)]">
                    Completado
                  </span>
                ) : (
                  <>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-[var(--radius-full)] text-[0.6875rem] font-medium bg-[rgba(255,255,255,0.04)] text-[var(--color-text-muted)]">
                      Bloqueado
                    </span>
                    {ach.progressText && (
                      <span className="text-[0.6875rem] text-[var(--color-text-muted)] tabular-nums whitespace-nowrap">
                        {ach.progressText}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. AJUSTES */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-medium text-[var(--color-text-secondary)]">
          Ajustes
        </h3>

        <div className="flex flex-col gap-2.5">
          {/* Ajuste: Alertas */}
          <div className="glass rounded-[var(--radius-lg)] p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] flex items-center justify-center shrink-0 text-[var(--color-text-secondary)]">
                <Bell size={16} />
              </div>
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                Alertas
              </span>
            </div>

            <label className="switch">
              <input
                type="checkbox"
                checked={alertsEnabled}
                onChange={(e) => setAlertsEnabled(e.target.checked)}
              />
              <span className="switch-track">
                <span className="switch-thumb" />
              </span>
            </label>
          </div>

          {/* Ajuste: Efectos */}
          <div className="glass rounded-[var(--radius-lg)] p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] flex items-center justify-center shrink-0 text-[var(--color-text-secondary)]">
                <Volume2 size={16} />
              </div>
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                Efectos
              </span>
            </div>

            <label className="switch">
              <input
                type="checkbox"
                checked={effectsEnabled}
                onChange={(e) => setEffectsEnabled(e.target.checked)}
              />
              <span className="switch-track">
                <span className="switch-thumb" />
              </span>
            </label>
          </div>
        </div>

        {/* 6. CERRAR SESIÓN */}
        <Button
          onClick={handleLogout}
          disabled={isPending}
          variant="secondary"
          size="lg"
          className="w-full mt-3"
        >
          <LogOut size={16} />
          {isPending ? 'Cerrando…' : 'Cerrar sesión'}
        </Button>
      </div>
    </div>
  )
}
