'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BarChart2, Wallet, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'INICIO',    icon: Home },
  { href: '/accounts',  label: 'CUENTAS',   icon: Wallet },
  { href: '/metrics',   label: 'MÉTRICAS',  icon: BarChart2 },
  { href: '/chat',      label: 'AGENTE IA', icon: Bot },
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
        'fixed bottom-0 left-0 right-0 z-40',
        'bg-[#111424] border-t border-[#1e233f]',
        'flex items-center justify-around h-16 max-w-lg mx-auto',
        'pb-[env(safe-area-inset-bottom)]'
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
              'flex-1 h-full flex flex-col items-center justify-center gap-1 transition-all duration-75',
              'font-mono tracking-wider select-none active:scale-95 touch-manipulation',
              active
                ? 'bg-[#00FF66] text-[#000000] font-bold shadow-[0_0_12px_rgba(0,255,102,0.4)]'
                : 'text-[#8B92A9] hover:text-white hover:bg-[#181c31]'
            )}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={20} className={active ? 'text-black stroke-[2.5]' : 'stroke-[1.8]'} />
            <span className="text-[10px] uppercase font-bold tracking-widest">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
