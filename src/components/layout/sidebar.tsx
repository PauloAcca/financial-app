'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Wallet,
  Tag,
  ArrowLeftRight,
  TrendingUp,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/actions/auth'
import { useState, useTransition } from 'react'

const NAV_ITEMS = [
  { href: '/dashboard',    label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/accounts',     label: 'Cuentas',       icon: Wallet },
  { href: '/categories',   label: 'Categorías',    icon: Tag },
  { href: '/transactions', label: 'Transacciones', icon: ArrowLeftRight },
  { href: '/chat',         label: 'Asistente',     icon: MessageSquare },
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
        'bg-[var(--color-surface)] border-r border-[var(--color-border)]',
        'transition-all duration-300',
        collapsed ? 'w-[68px]' : 'w-[220px]'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 h-16 border-b border-[var(--color-border)]', collapsed && 'justify-center px-0')}>
        <div
          className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
        >
          <TrendingUp size={16} className="text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-[var(--color-text-primary)] truncate">Finanzas</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 h-10 rounded-[var(--radius-md)]',
                'text-sm font-medium transition-all duration-150',
                collapsed ? 'justify-center px-0' : '',
                active
                  ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]'
              )}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className={cn('px-2 py-3 border-t border-[var(--color-border)] flex flex-col gap-1', collapsed && 'items-center')}>
        {/* Usuario */}
        {!collapsed && displayName && (
          <div className="px-3 py-2 mb-1">
            <p className="text-xs text-[var(--color-text-muted)]">Conectado como</p>
            <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{displayName}</p>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={isPending}
          className={cn(
            'flex items-center gap-3 px-3 h-10 rounded-[var(--radius-md)] w-full',
            'text-sm font-medium text-[var(--color-text-muted)]',
            'hover:bg-[var(--color-danger-subtle)] hover:text-[var(--color-danger)]',
            'transition-all duration-150 cursor-pointer',
            collapsed && 'justify-center px-0'
          )}
          title="Cerrar sesión"
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>

        {/* Colapsar */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center gap-3 px-3 h-9 rounded-[var(--radius-md)] w-full',
            'text-xs text-[var(--color-text-muted)]',
            'hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]',
            'transition-all duration-150 cursor-pointer',
            collapsed && 'justify-center px-0'
          )}
          aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Colapsar</span></>}
        </button>
      </div>
    </aside>
  )
}
