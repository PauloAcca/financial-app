'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  DollarSign,
  Trophy,
  PiggyBank,
  Plane,
  Lock,
  ChevronRight,
  Bell,
  Volume2,
  LogOut,
  Wallet,
  Repeat,
  Tag,
  BarChart2,
  MessageSquare,
  Sliders,
  Shield,
  Coins,
  Swords,
  History,
  Bot,
  Eye,
  EyeOff,
  HandCoins,
} from 'lucide-react'
import { logout } from '@/actions/auth'
import { cn, formatCurrency } from '@/lib/utils'
import { AVATAR_OPTIONS } from '@/lib/constants'
import { Modal } from '@/components/ui/modal'
import { toast } from '@/components/ui/toast'
import type { UserGameStats, Achievement } from '@/lib/gamification'

const SYSTEM_MODULES = [
  {
    href: '/transactions',
    title: 'Historial de Movimientos',
    description: 'Registro completo de transacciones y filtros',
    icon: History,
    color: '#00FF66',
    borderColor: 'border-[#00FF66]/50',
    bgColor: 'bg-[#00FF66]/15',
  },
  {
    href: '/accounts',
    title: 'Cuentas y Bóvedas',
    description: 'Bancos, billeteras virtuales y brokers',
    icon: Wallet,
    color: '#38d9f5',
    borderColor: 'border-[#38d9f5]/50',
    bgColor: 'bg-[#38d9f5]/15',
  },
  {
    href: '/prestamos',
    title: 'Préstamos y Deudas',
    description: 'Dinero prestado a terceros y deudas pendientes',
    icon: HandCoins,
    color: '#00FF66',
    borderColor: 'border-[#00FF66]/50',
    bgColor: 'bg-[#00FF66]/15',
  },
  {
    href: '/recurring',
    title: 'Gastos Fijos y Servicios',
    description: 'Suscripciones y débitos recurrentes',
    icon: Repeat,
    color: '#a855f7',
    borderColor: 'border-[#a855f7]/50',
    bgColor: 'bg-[#a855f7]/15',
  },
  {
    href: '/categories',
    title: 'Categorías de Misión',
    description: 'Organización de botín y gastos',
    icon: Tag,
    color: '#fbbf24',
    borderColor: 'border-[#fbbf24]/50',
    bgColor: 'bg-[#fbbf24]/15',
  },
  {
    href: '/metrics',
    title: 'Métricas y Estadísticas',
    description: 'Gráficos de rendimiento financiero',
    icon: BarChart2,
    color: '#38d9f5',
    borderColor: 'border-[#38d9f5]/50',
    bgColor: 'bg-[#38d9f5]/15',
  },
  {
    href: '/chat',
    title: 'Asistente IA (Oráculo)',
    description: 'Carga por voz e inteligencia artificial',
    icon: Bot,
    color: '#ff4d6d',
    borderColor: 'border-[#ff4d6d]/50',
    bgColor: 'bg-[#ff4d6d]/15',
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
      return <Swords size={20} style={{ color }} />
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
  const [avatarUrl, setAvatarUrl] = useState('/pixel-avatar.jpg')
  const [avatarModalOpen, setAvatarModalOpen] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('hide_balance')
      if (saved !== null) setIsHidden(saved === 'true')

      const savedAvatar = localStorage.getItem('app_user_avatar')
      if (savedAvatar) setAvatarUrl(savedAvatar)
    } catch (e) {
      console.error(e)
    }
  }, [])

  function handleSelectAvatar(url: string) {
    setAvatarUrl(url)
    try {
      localStorage.setItem('app_user_avatar', url)
      window.dispatchEvent(new Event('avatar_changed'))
      toast.success('¡Avatar de jugador actualizado!')
    } catch (e) {
      console.error(e)
    }
    setAvatarModalOpen(false)
  }

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
    <div className="flex flex-col gap-6 max-w-md mx-auto w-full font-mono pb-6">
      {/* 1. TARJETA HERO DE PERFIL */}
      <div className="bg-[#181c31] pixel-border-green rounded-[4px] p-5 shadow-[0_0_15px_rgba(0,255,102,0.2)]">
        {/* Fila: Avatar a la izquierda, Nombre y Nivel a la derecha */}
        <div className="flex items-center gap-4">
          {/* Avatar a la izquierda (con botón para cambiar) */}
          <button
            onClick={() => setAvatarModalOpen(true)}
            className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-[4px] border-2 border-[#00FF66] bg-[#111424] overflow-hidden shadow-[0_0_15px_rgba(0,255,102,0.4)] group cursor-pointer active:scale-95 transition-all"
            title="Toca para cambiar avatar / skin"
          >
            <Image
              src={avatarUrl}
              alt={displayName}
              width={96}
              height={96}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              priority
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[10px] font-bold text-[#00FF66] uppercase tracking-wider text-center p-1">
              CAMBIAR FOTO
            </div>
          </button>

          {/* Nombre de Usuario y Nivel a la derecha */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <div className="border border-[#00FF66] px-2.5 py-0.5 bg-[#0f111e] text-[#00FF66] text-xs font-bold tracking-widest rounded-[2px] shadow-[0_0_6px_rgba(0,255,102,0.3)]">
                NIVEL {stats.level}
              </div>
              <span className="text-[11px] text-[#38d9f5] font-bold tracking-wider uppercase">
                {stats.rank}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-white tracking-wider glow-text-green uppercase truncate">
              {displayName}
            </h2>
            <button
              onClick={() => setAvatarModalOpen(true)}
              className="text-[11px] text-[#00FF66] hover:underline tracking-wider mt-0.5 uppercase flex items-center gap-1 cursor-pointer"
            >
              <span>CAMBIAR AVATAR ➔</span>
            </button>
          </div>
        </div>

        {/* Barra de Progreso de Nivel REAL */}
        <div className="w-full bg-[#20253f] h-3 rounded-[2px] mt-4 overflow-hidden border border-[#293056]">
          <div
            className="bg-[#00FF66] h-full shadow-[0_0_8px_rgba(0,255,102,0.6)] transition-all duration-500"
            style={{ width: `${stats.progressPercent}%` }}
          />
        </div>
        <p className="text-[11px] text-[#8B92A9] text-right mt-1.5 tracking-wider">
          {stats.progressPercent}% para el Nivel {stats.level + 1} ({stats.currentXP} / {stats.nextLevelXP} XP)
        </p>
      </div>

      {/* MODAL: Selector de Avatar / Skin */}
      <Modal
        open={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        title="🎭 Elegir Avatar de Jugador"
        description="Seleccioná tu apariencia en Pixel Realm:"
      >
        <div className="grid grid-cols-3 gap-3 py-2 font-mono">
          {AVATAR_OPTIONS.map((avatar) => {
            const isSelected = avatarUrl === avatar.url
            return (
              <button
                key={avatar.id}
                type="button"
                onClick={() => handleSelectAvatar(avatar.url)}
                className={cn(
                  'flex flex-col items-center gap-2 p-2.5 rounded-[4px] border transition-all cursor-pointer group',
                  isSelected
                    ? 'border-[#00FF66] bg-[#00FF66]/15 shadow-[0_0_15px_rgba(0,255,102,0.35)] scale-105'
                    : 'border-[#293056] bg-[#14182b] hover:border-[#38d9f5] hover:bg-[#181c31]'
                )}
              >
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-[4px] overflow-hidden border border-white/10 shadow-sm">
                  <Image
                    src={avatar.url}
                    alt={avatar.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="text-center">
                  <p className={cn('text-xs font-bold truncate max-w-[90px]', isSelected ? 'text-[#00FF66]' : 'text-white')}>
                    {avatar.name}
                  </p>
                  <span className="text-[10px] text-[#8B92A9] uppercase font-bold">
                    {avatar.role}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </Modal>

      {/* 2. FILA DE ESTADÍSTICAS REALES (2 CARDS) */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Card ORO TOTAL REAL con toggle de ojo */}
        <div className="bg-[#181c31] border border-[#293056] rounded-[4px] p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-[#38d9f5] text-xs font-bold tracking-wider uppercase">
              <DollarSign size={15} className="stroke-[2.5]" />
              <span>ORO TOTAL</span>
            </div>
            <button
              onClick={toggleHide}
              aria-label={isHidden ? 'Mostrar saldo' : 'Ocultar saldo'}
              className="text-[#38d9f5]/70 hover:text-[#38d9f5] p-0.5 rounded cursor-pointer transition-colors"
            >
              {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <div className="text-lg sm:text-xl font-bold text-white tracking-tight tabular-nums truncate select-none">
            {isHidden ? '••••••••' : formatCurrency(stats.totalBalance, currency)}
          </div>
        </div>

        {/* Card DESBLOQUEADO REAL */}
        <div className="bg-[#181c31] border border-[#293056] rounded-[4px] p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-[#ff4d6d] text-xs font-bold tracking-wider uppercase mb-2">
            <Trophy size={15} className="stroke-[2.5]" />
            <span>DESBLOQUEADO</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-white tracking-tight tabular-nums">
            {stats.unlockedAchievementsCount}/{stats.totalAchievementsCount}
          </div>
        </div>
      </div>

      {/* 3. SECCIÓN HERRAMIENTAS Y MÓDULOS ADICIONALES */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[#00FF66] text-xs font-bold tracking-widest uppercase">
          <Sliders size={14} />
          <span>HERRAMIENTAS DEL SISTEMA</span>
        </div>
        <div className="h-px bg-[#293056] w-full" />

        <div className="flex flex-col gap-2.5">
          {SYSTEM_MODULES.map((module) => {
            const Icon = module.icon
            return (
              <Link
                key={module.href}
                href={module.href}
                prefetch={true}
                className="bg-[#181c31] border border-[#293056] rounded-[4px] p-3.5 flex items-center justify-between gap-3 hover:border-[#00FF66] hover:bg-[#1e233d] transition-all cursor-pointer group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-[4px] border flex items-center justify-center shrink-0',
                      module.borderColor,
                      module.bgColor
                    )}
                  >
                    <Icon size={20} style={{ color: module.color }} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white tracking-wide group-hover:text-[#00FF66] transition-colors truncate">
                      {module.title}
                    </h4>
                    <p className="text-xs text-[#8B92A9] mt-0.5 truncate">
                      {module.description}
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-[#8B92A9] group-hover:text-[#00FF66] group-hover:translate-x-1 transition-all shrink-0" />
              </Link>
            )
          })}
        </div>
      </div>

      {/* 4. SECCIÓN LOGROS REALES */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#00FF66] text-xs font-bold tracking-widest uppercase">
            <Trophy size={14} />
            <span>LOGROS ({stats.unlockedAchievementsCount}/{stats.totalAchievementsCount})</span>
          </div>
        </div>
        <div className="h-px bg-[#293056] w-full" />

        <div className="flex flex-col gap-2.5">
          {stats.achievements.map((ach) => (
            <div
              key={ach.id}
              className={cn(
                'rounded-[4px] p-3.5 flex items-center justify-between gap-3 transition-all',
                ach.unlocked
                  ? 'bg-[#181c31] border border-[#293056] hover:border-[#00FF66]/50'
                  : 'bg-[#181c31]/50 border border-[#293056]/50 opacity-60'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    'w-10 h-10 rounded-[4px] flex items-center justify-center shrink-0 border',
                    ach.unlocked
                      ? 'border-current bg-[#111424]'
                      : 'border-[#293056] bg-[#111424]'
                  )}
                  style={ach.unlocked ? { borderColor: ach.color } : undefined}
                >
                  {ach.unlocked ? (
                    getAchievementIcon(ach.iconType, ach.color)
                  ) : (
                    <Lock size={18} className="text-[#5d6786]" />
                  )}
                </div>

                <div className="min-w-0">
                  <h4 className={cn('text-sm font-bold tracking-wide truncate', ach.unlocked ? 'text-white' : 'text-[#8B92A9]')}>
                    {ach.title}
                  </h4>
                  <p className="text-xs text-[#8B92A9] mt-0.5 truncate">
                    {ach.description}
                  </p>
                </div>
              </div>

              {/* Estado / Progreso */}
              <div className="shrink-0 text-right">
                {ach.unlocked ? (
                  <span className="text-[10px] text-[#00FF66] font-bold bg-[#00FF66]/15 px-2 py-0.5 rounded-[2px] border border-[#00FF66]/30">
                    DESBLOQUEADO ✓
                  </span>
                ) : (
                  <span className="text-[10px] text-[#8B92A9] font-bold bg-[#14182b] px-2 py-0.5 rounded-[2px] border border-[#293056]">
                    {ach.progressText || 'BLOQUEADO'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. SECCIÓN AJUSTES */}
      <div className="flex flex-col gap-3 mt-1">
        <div className="flex items-center gap-2 text-[#00FF66] text-xs font-bold tracking-widest uppercase">
          <span>AJUSTES</span>
        </div>
        <div className="h-px bg-[#293056] w-full" />

        <div className="flex flex-col gap-2.5">
          {/* Ajuste 1: ALERTAS */}
          <div className="bg-[#181c31] border border-[#293056] rounded-[4px] p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell size={18} className="text-white" />
              <span className="text-sm font-bold text-white tracking-wide uppercase">
                ALERTAS
              </span>
            </div>

            {/* Switch Retro */}
            <label className="retro-switch cursor-pointer">
              <input
                type="checkbox"
                checked={alertsEnabled}
                onChange={(e) => setAlertsEnabled(e.target.checked)}
              />
              <span className="retro-slider" />
            </label>
          </div>

          {/* Ajuste 2: EFECTOS */}
          <div className="bg-[#181c31] border border-[#293056] rounded-[4px] p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 size={18} className="text-white" />
              <span className="text-sm font-bold text-white tracking-wide uppercase">
                EFECTOS
              </span>
            </div>

            {/* Switch Retro */}
            <label className="retro-switch cursor-pointer">
              <input
                type="checkbox"
                checked={effectsEnabled}
                onChange={(e) => setEffectsEnabled(e.target.checked)}
              />
              <span className="retro-slider" />
            </label>
          </div>
        </div>

        {/* 6. BOTÓN CERRAR SESIÓN */}
        <button
          onClick={handleLogout}
          disabled={isPending}
          className="btn-arcade-green flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-[4px] mt-4 w-full cursor-pointer"
        >
          <LogOut size={18} className="text-black stroke-[2.5]" />
          <span className="text-xs font-bold font-mono tracking-widest text-black uppercase">
            {isPending ? 'CERRANDO...' : 'CERRAR SESIÓN'}
          </span>
        </button>
      </div>
    </div>
  )
}
