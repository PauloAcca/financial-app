'use client'

import Link from 'next/link'
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
  HandCoins,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/actions/auth'
import { useState, useEffect, useTransition } from 'react'
import { BrandMark, Wordmark } from '@/components/ui/brand'
import { Avatar } from '@/components/ui/avatar'
import { AVATAR_IMAGES } from '@/lib/constants'

const NAV_ITEMS = [
  { href: '/dashboard',    label: 'Inicio',        icon: Home },
  { href: '/transactions', label: 'Historial',    icon: History },
  { href: '/metas',        label: 'Metas',         icon: Trophy },
  { href: '/profile',      label: 'Perfil',        icon: User },
  { href: '/accounts',     label: 'Cuentas',       icon: Wallet },
  { href: '/inversiones',  label: 'Inversiones',   icon: TrendingUp },
  { href: '/prestamos',    label: 'Préstamos',     icon: HandCoins },
  { href: '/recurring',    label: 'Gastos fijos',  icon: Repeat },
  { href: '/categories',   label: 'Categorías',    icon: Tag },
  { href: '/metrics',      label: 'Métricas',      icon: BarChart2 },
  { href: '/chat',         label: 'Asistente',    icon: MessageSquare },
]

interface SidebarProps {
  displayName?: string | null
}

export function Sidebar({ displayName }: SidebarProps) {
  const pathname = usePathname()
  const [optimisticPath, setOptimisticPath] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    setOptimisticPath(null)
  }, [pathname])

  useEffect(() => {
    function updateAvatar() {
      try {
        const saved = localStorage.getItem('app_user_avatar')
        setAvatarUrl(saved && AVATAR_IMAGES.includes(saved) ? saved : null)
      } catch {
        /* noop */
      }
    }
    updateAvatar()
    window.addEventListener('avatar_changed', updateAvatar)
    return () => window.removeEventListener('avatar_changed', updateAvatar)
  }, [])

  const currentPath = optimisticPath ?? pathname

  function handleLogout() {
    startTransition(() => logout())
  }

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col',
        'bg-[rgba(255,255,255,0.02)] backdrop-blur-xl',
        'border-r border-[rgba(255,255,255,0.06)]',
        'transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[228px]'
      )}
    >
      {/* Marca */}
      <div
        className={cn(
          'flex items-center gap-3 px-4 h-16 border-b border-[rgba(255,255,255,0.06)]',
          collapsed && 'justify-center px-0'
        )}
      >
        <Link href="/dashboard" prefetch={true} className="flex items-center gap-3">
          <BrandMark size={30} />
          {!collapsed && <Wordmark subtitle="finanzas" />}
        </Link>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-2.5 py-4 flex flex-col gap-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = currentPath === href || (href !== '/dashboard' && currentPath.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              onClick={() => setOptimisticPath(href)}
              className={cn(
                'flex items-center gap-3 px-3 h-10 rounded-[var(--radius-md)]',
                'text-sm font-medium transition-all duration-200 select-none',
                collapsed ? 'justify-center px-0' : '',
                active
                  ? 'bg-[rgba(255,255,255,0.07)] text-[var(--color-text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--color-text-primary)]'
              )}
              title={collapsed ? label : undefined}
            >
              <Icon
                size={18}
                className={cn('shrink-0 transition-colors', active && 'text-[var(--color-accent)]')}
              />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Pie */}
      <div
        className={cn(
          'px-2.5 py-3 border-t border-[rgba(255,255,255,0.06)] flex flex-col gap-1.5',
          collapsed && 'items-center'
        )}
      >
        {/* Usuario */}
        {!collapsed && displayName && (
          <div className="flex items-center gap-2.5 px-2.5 py-2 bg-[rgba(255,255,255,0.04)] rounded-[var(--radius-md)] border border-[rgba(255,255,255,0.06)]">
            <Avatar name={displayName} src={avatarUrl} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-[0.6875rem] text-[var(--color-text-muted)]">Usuario</p>
              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{displayName}</p>
            </div>
          </div>
        )}
        {collapsed && displayName && <Avatar name={displayName} src={avatarUrl} size="sm" />}

        {/* Cerrar sesión */}
        <button
          onClick={handleLogout}
          disabled={isPending}
          className={cn(
            'flex items-center gap-3 px-3 h-10 rounded-[var(--radius-md)] w-full',
            'text-sm font-medium text-[var(--color-text-secondary)]',
            'hover:bg-[rgba(227,160,170,0.1)] hover:text-[var(--color-danger)]',
            'transition-all duration-200 cursor-pointer',
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
            'flex items-center gap-3 px-3 h-8 rounded-[var(--radius-md)] w-full',
            'text-xs text-[var(--color-text-muted)]',
            'hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--color-text-primary)]',
            'transition-all duration-200 cursor-pointer',
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
