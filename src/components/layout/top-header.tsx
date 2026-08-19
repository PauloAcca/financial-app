'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'INICIO',
  '/transactions': 'HISTORIAL',
  '/metas': 'METAS',
  '/profile': 'PERFIL',
  '/accounts': 'CUENTAS',
  '/categories': 'CATEGORÍAS',
  '/metrics': 'MÉTRICAS',
  '/chat': 'ASISTENTE',
  '/recurring': 'GASTOS FIJOS',
}

export function TopHeader() {
  const pathname = usePathname()

  // Buscar coincidencia de título
  const matchingKey = Object.keys(PAGE_TITLES).find(key => 
    pathname === key || (key !== '/dashboard' && pathname.startsWith(key))
  )
  const title = matchingKey ? PAGE_TITLES[matchingKey] : 'INICIO'

  return (
    <header className="sticky top-0 z-30 w-full bg-[#111424]/90 backdrop-blur-md border-b border-[#1e233f] px-4 py-3">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        {/* Logo & Título */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" prefetch={true} className="flex items-center gap-2 group">
            <div className="relative w-8 h-8 rounded-[4px] border border-[#00FF66] bg-[#181c31] overflow-hidden flex items-center justify-center shadow-[0_0_8px_rgba(0,255,102,0.3)]">
              <Image
                src="/pixel-coin.jpg"
                alt="Pixel Realm"
                width={32}
                height={32}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <h1 className="text-xl font-bold font-mono text-[#00FF66] tracking-wider glow-text-green">
              {title}
            </h1>
          </Link>
        </div>

        {/* Acciones derecha: Notificaciones y Avatar */}
        <div className="flex items-center gap-2.5">
          {/* Botón Campana */}
          <button
            aria-label="Notificaciones"
            className="w-9 h-9 rounded-[4px] bg-[#1c213a] border border-[#293056] flex items-center justify-center text-[#00FF66] hover:border-[#00FF66] hover:bg-[#232845] transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Bell size={18} className="fill-[#00FF66]/20 text-[#00FF66]" />
          </button>

          {/* Botón Avatar */}
          <Link
            href="/profile"
            prefetch={true}
            aria-label="Perfil de usuario"
            className="relative w-9 h-9 rounded-[4px] border-2 border-[#00FF66] bg-[#181c31] overflow-hidden flex items-center justify-center shadow-[0_0_10px_rgba(0,255,102,0.35)] hover:scale-105 active:scale-95 transition-transform"
          >
            <Image
              src="/pixel-avatar.jpg"
              alt="Avatar Cipherpunk"
              width={36}
              height={36}
              className="w-full h-full object-cover"
              priority
            />
          </Link>
        </div>
      </div>
    </header>
  )
}
