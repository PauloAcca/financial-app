'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, History, Trophy, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard',    label: 'INICIO',    icon: Home },
  { href: '/transactions', label: 'HISTORIAL', icon: History },
  { href: '/metas',        label: 'METAS',     icon: Trophy },
  { href: '/profile',      label: 'PERFIL',    icon: User },
]

export function MobileNav() {
  const pathname = usePathname()

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
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 h-full flex flex-col items-center justify-center gap-1 transition-all duration-100',
              'font-mono tracking-wider select-none',
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
