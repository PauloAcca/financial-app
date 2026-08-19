'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Wallet, Tag, ArrowLeftRight, MessageSquare, BarChart2, Repeat } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard',    label: 'Inicio',      icon: LayoutDashboard },
  { href: '/transactions', label: 'Movimientos', icon: ArrowLeftRight },
  { href: '/recurring',    label: 'Fijos',        icon: Repeat },
  { href: '/categories',   label: 'Categorías',  icon: Tag },
  { href: '/metrics',      label: 'Métricas',    icon: BarChart2 },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        'lg:hidden fixed bottom-0 left-0 right-0 z-40',
        'bg-[var(--color-surface)] border-t border-[var(--color-border)]',
        'flex items-center',
        'pb-[env(safe-area-inset-bottom)]'
      )}
      aria-label="Navegación principal"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-1 py-3',
              'text-xs font-medium transition-colors duration-150',
              active
                ? 'text-[var(--color-accent)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            )}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
