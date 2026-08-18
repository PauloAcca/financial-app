import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'income' | 'expense' | 'transfer' | 'system' | 'muted'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default:  'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]',
  income:   'bg-[var(--color-income-subtle)] text-[var(--color-income)]',
  expense:  'bg-[var(--color-expense-subtle)] text-[var(--color-expense)]',
  transfer: 'bg-[var(--color-transfer-subtle)] text-[var(--color-transfer)]',
  system:   'bg-[var(--color-surface-3)] text-[var(--color-text-muted)] border border-[var(--color-border)]',
  muted:    'bg-[var(--color-surface-2)] text-[var(--color-text-muted)]',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5',
        'rounded-[var(--radius-full)]',
        'text-xs font-medium whitespace-nowrap',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
