import Image from 'next/image'
import { cn } from '@/lib/utils'

/**
 * Avatar — imagen de perfil (si hay una elegida) o iniciales
 * del usuario sobre vidrio con tinte de la paleta Aura.
 * Determinístico según el nombre cuando usa iniciales.
 */

const TONES = [
  { bg: 'rgba(143, 203, 176, 0.18)', fg: '#A5D8C3', ring: 'rgba(143, 203, 176, 0.35)' },
  { bg: 'rgba(166, 185, 232, 0.18)', fg: '#BCCBEF', ring: 'rgba(166, 185, 232, 0.35)' },
  { bg: 'rgba(191, 174, 232, 0.18)', fg: '#CFC2EE', ring: 'rgba(191, 174, 232, 0.35)' },
  { bg: 'rgba(228, 194, 143, 0.16)', fg: '#E5CD9F', ring: 'rgba(228, 194, 143, 0.35)' },
  { bg: 'rgba(227, 160, 170, 0.16)', fg: '#E9BCC1', ring: 'rgba(227, 160, 170, 0.35)' },
]

export function getInitials(name?: string | null): string {
  if (!name) return '·'
  const cleaned = name.trim().split(/\s+/).filter(Boolean)
  if (cleaned.length === 0) return '·'
  if (cleaned.length === 1) {
    return cleaned[0].slice(0, 2).toUpperCase()
  }
  return (
    cleaned[0][0].toUpperCase() +
    cleaned[cleaned.length - 1][0].toUpperCase()
  )
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0
  }
  return h
}

const SIZES = {
  xs: 'h-6 w-6 text-[0.625rem]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
}

export function Avatar({
  name,
  src,
  size = 'md',
  className,
}: {
  name?: string | null
  src?: string | null
  size?: keyof typeof SIZES
  className?: string
}) {
  const label = name?.trim() || 'Usuario'

  // Imagen de perfil elegida
  if (src) {
    return (
      <span
        title={label}
        className={cn(
          'relative inline-flex items-center justify-center rounded-full overflow-hidden select-none shrink-0',
          'border border-[rgba(255,255,255,0.14)]',
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_2px_10px_rgba(3,6,10,0.4)]',
          SIZES[size],
          className
        )}
      >
        <Image
          src={src}
          alt={label}
          fill
          sizes="64px"
          className="rounded-full object-cover"
        />
      </span>
    )
  }

  // Iniciales
  const tone = TONES[hashString(label.toLowerCase()) % TONES.length]
  const initials = getInitials(label)

  return (
    <span
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold select-none shrink-0',
        'backdrop-blur-md',
        SIZES[size],
        className
      )}
      style={{
        background: tone.bg,
        color: tone.fg,
        boxShadow: `inset 0 0 0 1px ${tone.ring}, inset 0 1px 0 rgba(255,255,255,0.08)`,
      }}
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}
