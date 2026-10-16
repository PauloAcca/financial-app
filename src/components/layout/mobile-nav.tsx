'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Home, BarChart2, Wallet, Bot, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard',   label: 'Inicio',     icon: Home },
  { href: '/accounts',    label: 'Cuentas',    icon: Wallet },
  { href: '/inversiones', label: 'Inversión',   icon: TrendingUp },
  { href: '/metrics',     label: 'Métricas',    icon: BarChart2 },
  { href: '/chat',        label: 'Asistente',  icon: Bot },
]

export function MobileNav() {
  const pathname = usePathname()
  const [optimisticPath, setOptimisticPath] = useState<string | null>(null)

  // Resetear estado optimista cuando la ruta real cambie
  useEffect(() => {
    setOptimisticPath(null)
  }, [pathname])

  const currentPath = optimisticPath ?? pathname

  return (
    <nav
      className={cn(
        'fixed left-3 right-3 z-40',
        'bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))]',
        'max-w-lg mx-auto',
        'glass-strong rounded-[var(--radius-full)]',
        'flex items-center justify-around h-16 px-2'
      )}
      aria-label="Navegación principal"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = currentPath === href || (href !== '/dashboard' && currentPath.startsWith(href))

        return (
          <Link
            key={href}
            href={href}
            prefetch={true}
            onClick={() => setOptimisticPath(href)}
            className={cn(
              'flex items-center justify-center rounded-[var(--radius-full)] transition-all duration-200',
              'h-11 w-11 select-none active:scale-95 touch-manipulation',
              active
                ? 'bg-[rgba(255,255,255,0.09)] text-[var(--color-accent)] shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            )}
            aria-current={active ? 'page' : undefined}
            aria-label={label}
            title={label}
          >
            <Icon size={21} className={active ? 'stroke-[2.1]' : 'stroke-[1.7]'} />
          </Link>
        )
      })}
    </nav>
  )
}
