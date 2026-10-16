import Link from 'next/link'
import { BrandMark } from '@/components/ui/brand'

/**
 * AuthCard — vidrio compartido para login y signup:
 * marca, titular, divisor "o con tu email" y pie con link.
 */
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="glass-strong rounded-[var(--radius-xl)] p-7 sm:p-8">
      {/* Marca */}
      <div className="flex flex-col items-center gap-3 mb-7">
        <BrandMark size={44} />
        <div className="flex flex-col items-center">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            Aura
          </h1>
          <p className="mt-1 text-[0.625rem] font-medium tracking-[0.2em] text-[var(--color-text-muted)]">
            FINANZAS
          </p>
        </div>
      </div>

      {/* Titular */}
      <h2 className="font-display text-lg font-semibold text-[var(--color-text-primary)] mb-1">
        {title}
      </h2>
      <p className="text-sm text-[var(--color-text-secondary)] mb-5">{subtitle}</p>

      {children}

      {footer && (
        <p className="text-sm text-center text-[var(--color-text-secondary)] mt-6">{footer}</p>
      )}
    </div>
  )
}

/** Divider "o con tu email" */
export function AuthDivider() {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-[rgba(255,255,255,0.07)]" />
      <span className="text-xs text-[var(--color-text-muted)]">o con tu email</span>
      <div className="flex-1 h-px bg-[rgba(255,255,255,0.07)]" />
    </div>
  )
}

/** Mensaje de error de autenticación */
export function AuthError({ message }: { message: string }) {
  return (
    <div className="px-3.5 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] border border-[rgba(227,160,170,0.35)]">
      <p className="text-xs text-[var(--color-danger)] font-medium">{message}</p>
    </div>
  )
}

/** Google "G" */
export function GoogleGlyph() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

/** Link de pie de auth */
export function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] underline underline-offset-2 decoration-[rgba(143,203,176,0.4)] font-medium transition-colors"
    >
      {children}
    </Link>
  )
}
