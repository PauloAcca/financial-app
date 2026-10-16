import { cn } from '@/lib/utils'

/**
 * BrandMark — isotipo de Aura: cuadrado de vidrio con gradiente
 * salvia→azul niebla y un aro (aura) en el centro.
 */
export function BrandMark({
  size = 32,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="aura-brand-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8FCBB0" />
          <stop offset="1" stopColor="#A6B9E8" />
        </linearGradient>
      </defs>
      <rect
        x="3"
        y="3"
        width="42"
        height="42"
        rx="14"
        fill="url(#aura-brand-gradient)"
      />
      <rect
        x="3"
        y="3"
        width="42"
        height="42"
        rx="14"
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1"
      />
      {/* Aro exterior tenue */}
      <circle
        cx="24"
        cy="24"
        r="14"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.5"
      />
      {/* Aro interior nítido */}
      <circle
        cx="24"
        cy="24"
        r="9"
        fill="none"
        stroke="rgba(246,250,248,0.95)"
        strokeWidth="2.6"
      />
    </svg>
  )
}

/**
 * Wordmark — "Aura" en Fraunces, con subtítulo opcional.
 */
export function Wordmark({
  className,
  subtitle,
}: {
  className?: string
  subtitle?: string
}) {
  return (
    <span className={cn('flex flex-col leading-none', className)}>
      <span className="font-display text-[1.3rem] font-semibold tracking-tight text-[var(--color-text-primary)]">
        Aura
      </span>
      {subtitle && (
        <span className="mt-1 text-[0.625rem] font-medium tracking-[0.18em] text-[var(--color-text-muted)]">
          {subtitle}
        </span>
      )}
    </span>
  )
}
