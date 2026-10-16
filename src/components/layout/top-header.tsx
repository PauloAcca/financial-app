'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Inicio',
  '/transactions': 'Historial',
  '/metas': 'Metas',
  '/profile': 'Perfil',
  '/accounts': 'Cuentas',
  '/inversiones': 'Inversiones',
  '/prestamos': 'Préstamos',
  '/categories': 'Categorías',
  '/metrics': 'Métricas',
  '/chat': 'Asistente',
  '/recurring': 'Gastos fijos',
}

export function TopHeader({ displayName }: { displayName?: string | null }) {
  const pathname = usePathname()

  // Buscar coincidencia de título
  const matchingKey = Object.keys(PAGE_TITLES).find(
    (key) => pathname === key || (key !== '/dashboard' && pathname.startsWith(key))
  )
  const title = matchingKey ? PAGE_TITLES[matchingKey] : 'Inicio'

  return (
    <header className="sticky top-0 z-30 w-full h-[57px] shrink-0 flex items-center bg-[rgba(10,14,20,0.55)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.06)] px-4">
      <div className="max-w-lg w-full mx-auto flex items-center justify-between">
        {/* Título de página */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" prefetch={true} className="group">
            <h1 className="font-display text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
              {title}
            </h1>
          </Link>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          {/* Notificaciones */}
          <button
            aria-label="Notificaciones"
            className="w-9 h-9 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.09)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:border-[rgba(143,203,176,0.35)] transition-all cursor-pointer active:scale-95"
          >
            <Bell size={17} />
          </button>

          {/* Perfil */}
          <Link
            href="/profile"
            prefetch={true}
            aria-label="Perfil"
            className="transition-transform hover:scale-105 active:scale-95"
          >
            <span className="block rounded-full">
              <HeaderAvatar name={displayName} />
            </span>
          </Link>
        </div>
      </div>
    </header>
  )
}

function HeaderAvatar({ name }: { name?: string | null }) {
  const [avatarName, setAvatarName] = useState<string | null | undefined>(name)

  useEffect(() => {
    function updateName() {
      try {
        const saved = localStorage.getItem('app_user_display_name')
        if (saved) setAvatarName(saved)
        else if (name) setAvatarName(name)
      } catch {
        /* noop */
      }
    }
    updateName()
    window.addEventListener('display_name_changed', updateName)
    return () => window.removeEventListener('display_name_changed', updateName)
  }, [name])

  return <Avatar name={avatarName} size="sm" />
}
