'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Home,
  History,
  Trophy,
  User,
  Wallet,
  Tag,
  BarChart2,
  MessageSquare,
  Repeat,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/actions/auth'
import { useState, useTransition } from 'react'

const NAV_ITEMS = [
  { href: '/dashboard',    label: 'INICIO',        icon: Home },
  { href: '/transactions', label: 'HISTORIAL',     icon: History },
  { href: '/metas',        label: 'METAS',         icon: Trophy },
  { href: '/profile',      label: 'PERFIL',        icon: User },
  { href: '/accounts',     label: 'CUENTAS',       icon: Wallet },
  { href: '/recurring',    label: 'GASTOS FIJOS',  icon: Repeat },
  { href: '/categories',   label: 'CATEGORÍAS',    icon: Tag },
  { href: '/metrics',      label: 'MÉTRICAS',      icon: BarChart2 },
  { href: '/chat',         label: 'ASISTENTE IA',  icon: MessageSquare },
]

interface SidebarProps {
  displayName?: string | null
}

export function Sidebar({ displayName }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(() => logout())
  }

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col',
        'bg-[#111424] border-r border-[#1e233f]',
        'transition-all duration-300 font-mono',
        collapsed ? 'w-[72px]' : 'w-[230px]'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 h-16 border-b border-[#1e233f]', collapsed && 'justify-center px-0')}>
        <div className="relative w-8 h-8 rounded-[4px] border border-[#00FF66] bg-[#181c31] overflow-hidden flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(0,255,102,0.3)]">
          <Image
            src="/pixel-coin.jpg"
            alt="Pixel Realm"
            width={32}
            height={32}
            className="w-full h-full object-cover"
          />
        </div>
        {!collapsed && (
          <span className="font-bold text-[#00FF66] tracking-wider text-base glow-text-green truncate">
            PIXEL REALM
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 h-10 rounded-[4px]',
                'text-xs font-bold tracking-wider transition-all duration-150',
                collapsed ? 'justify-center px-0' : '',
                active
                  ? 'bg-[#00FF66] text-[#000000] shadow-[0_0_10px_rgba(0,255,102,0.3)]'
                  : 'text-[#8B92A9] hover:bg-[#181c31] hover:text-[#00FF66]'
              )}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className={cn('shrink-0', active ? 'text-black stroke-[2.5]' : '')} />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className={cn('px-2 py-3 border-t border-[#1e233f] flex flex-col gap-1', collapsed && 'items-center')}>
        {/* Usuario */}
        {!collapsed && displayName && (
          <div className="px-3 py-2 mb-1 bg-[#181c31] rounded-[4px] border border-[#293056]">
            <p className="text-[10px] text-[#8B92A9] uppercase">JUGADOR</p>
            <p className="text-xs font-bold text-[#00FF66] truncate">{displayName}</p>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={isPending}
          className={cn(
            'flex items-center gap-3 px-3 h-10 rounded-[4px] w-full',
            'text-xs font-bold tracking-wider text-[#ff4d6d]',
            'hover:bg-[rgba(255,77,109,0.15)] hover:border hover:border-[#ff4d6d]/40',
            'transition-all duration-150 cursor-pointer',
            collapsed && 'justify-center px-0'
          )}
          title="Cerrar sesión"
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>CERRAR SESIÓN</span>}
        </button>

        {/* Colapsar */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center gap-3 px-3 h-8 rounded-[4px] w-full',
            'text-[10px] text-[#5d6786]',
            'hover:bg-[#181c31] hover:text-white',
            'transition-all duration-150 cursor-pointer',
            collapsed && 'justify-center px-0'
          )}
          aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>COLAPSAR</span></>}
        </button>
      </div>
    </aside>
  )
}
