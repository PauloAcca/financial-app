'use client'

import { useState, useTransition } from 'react'
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
  ShieldAlert
} from 'lucide-react'
import { logout } from '@/actions/auth'
import { cn } from '@/lib/utils'

const SYSTEM_MODULES = [
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
    color: '#00FF66',
    borderColor: 'border-[#00FF66]/50',
    bgColor: 'bg-[#00FF66]/15',
  },
  {
    href: '/chat',
    title: 'Asistente IA (Oráculo)',
    description: 'Carga por voz e inteligencia artificial',
    icon: MessageSquare,
    color: '#ff4d6d',
    borderColor: 'border-[#ff4d6d]/50',
    bgColor: 'bg-[#ff4d6d]/15',
  },
]

export default function ProfilePage() {
  const [isPending, startTransition] = useTransition()
  const [alertsEnabled, setAlertsEnabled] = useState(true)
  const [effectsEnabled, setEffectsEnabled] = useState(false)

  function handleLogout() {
    startTransition(async () => {
      await logout()
    })
  }

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto w-full font-mono pb-6">
      {/* 1. TARJETA HERO DE PERFIL */}
      <div className="bg-[#181c31] pixel-border-green rounded-[4px] p-6 shadow-[0_0_15px_rgba(0,255,102,0.2)]">
        {/* Avatar Central con marco verde neón */}
        <div className="relative w-24 h-24 mx-auto rounded-[4px] border-2 border-[#00FF66] bg-[#111424] overflow-hidden shadow-[0_0_12px_rgba(0,255,102,0.35)]">
          <Image
            src="/pixel-avatar.jpg"
            alt="Cipherpunk99"
            width={96}
            height={96}
            className="w-full h-full object-cover"
            priority
          />
        </div>

        {/* Nombre de Usuario y Nivel */}
        <h2 className="text-xl sm:text-2xl font-bold text-[#00FF66] text-center tracking-wider mt-4 glow-text-green uppercase">
          CIPHERPUNK99
        </h2>
        <p className="text-xs text-[#8B92A9] text-center tracking-widest uppercase mt-1">
          NIVEL 42 • GRAN MAESTRO
        </p>

        {/* Barra de Progreso de Nivel (75%) */}
        <div className="w-full bg-[#20253f] h-3 rounded-[2px] mt-5 overflow-hidden border border-[#293056]">
          <div
            className="bg-[#00FF66] h-full shadow-[0_0_8px_rgba(0,255,102,0.6)] transition-all duration-500"
            style={{ width: '75%' }}
          />
        </div>
        <p className="text-[11px] text-[#8B92A9] text-right mt-1.5 tracking-wider">
          75% para el Nivel 43
        </p>
      </div>

      {/* 2. FILA DE ESTADÍSTICAS (2 CARDS) */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Card ORO TOTAL */}
        <div className="bg-[#181c31] border border-[#293056] rounded-[4px] p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-[#38d9f5] text-xs font-bold tracking-wider uppercase mb-2">
            <DollarSign size={15} className="stroke-[2.5]" />
            <span>ORO TOTAL</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            1.2M
          </div>
        </div>

        {/* Card DESBLOQUEADO */}
        <div className="bg-[#181c31] border border-[#293056] rounded-[4px] p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-[#ff4d6d] text-xs font-bold tracking-wider uppercase mb-2">
            <Trophy size={15} className="stroke-[2.5]" />
            <span>DESBLOQUEADO</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            24/50
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
                className="bg-[#181c31] border border-[#293056] rounded-[4px] p-3.5 flex items-center justify-between gap-3 hover:border-[#00FF66] hover:bg-[#1e233d] transition-all cursor-pointer group"
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

      {/* 4. SECCIÓN LOGROS */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[#00FF66] text-xs font-bold tracking-widest uppercase">
          <Trophy size={14} />
          <span>LOGROS</span>
        </div>
        <div className="h-px bg-[#293056] w-full" />

        <div className="flex flex-col gap-2.5">
          {/* Logro 1: Ahorrador Experto */}
          <div className="bg-[#181c31] border border-[#293056] rounded-[4px] p-3.5 flex items-center justify-between gap-3 hover:border-[#00FF66]/50 transition-all cursor-pointer">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-[4px] border border-[#00FF66] bg-[#111424] flex items-center justify-center shrink-0">
                <PiggyBank size={20} className="text-[#00FF66]" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white tracking-wide truncate">
                  Ahorrador Experto
                </h4>
                <p className="text-xs text-[#8B92A9] mt-0.5 truncate">
                  Guardó 10k de oro en la bóveda
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-[#8B92A9] shrink-0" />
          </div>

          {/* Logro 2: Trotamundos */}
          <div className="bg-[#181c31] border border-[#293056] rounded-[4px] p-3.5 flex items-center justify-between gap-3 hover:border-[#38d9f5]/50 transition-all cursor-pointer">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-[4px] border border-[#38d9f5] bg-[#111424] flex items-center justify-center shrink-0">
                <Plane size={20} className="text-[#38d9f5]" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white tracking-wide truncate">
                  Trotamundos
                </h4>
                <p className="text-xs text-[#8B92A9] mt-0.5 truncate">
                  Financió subcuenta de viajes
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-[#8B92A9] shrink-0" />
          </div>

          {/* Logro 3: Observador de Ballenas (Bloqueado) */}
          <div className="bg-[#181c31]/60 border border-[#293056]/60 rounded-[4px] p-3.5 flex items-center justify-between gap-3 opacity-60">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-[4px] border border-[#293056] bg-[#111424] flex items-center justify-center shrink-0">
                <Lock size={18} className="text-[#5d6786]" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-[#8B92A9] tracking-wide truncate">
                  Observador de Ballenas
                </h4>
                <p className="text-xs text-[#5d6786] mt-0.5 truncate">
                  Llega a 5M de oro total
                </p>
              </div>
            </div>
          </div>
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
