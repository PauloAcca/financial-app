'use client'

import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type Size = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variantStyles: Record<Variant, string> = {
  primary: [
    'bg-[var(--color-accent)] text-white',
    'hover:bg-[var(--color-accent-hover)]',
    'shadow-[0_0_16px_rgba(99,102,241,0.3)]',
    'hover:shadow-[0_0_24px_rgba(99,102,241,0.45)]',
  ].join(' '),
  secondary: [
    'bg-[var(--color-surface-2)] text-[var(--color-text-primary)]',
    'border border-[var(--color-border)]',
    'hover:bg-[var(--color-surface-3)] hover:border-[var(--color-accent)]',
  ].join(' '),
  ghost: [
    'bg-transparent text-[var(--color-text-secondary)]',
    'hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]',
  ].join(' '),
  danger: [
    'bg-[var(--color-danger-subtle)] text-[var(--color-danger)]',
    'border border-[var(--color-danger)]/30',
    'hover:bg-[var(--color-danger)] hover:text-white',
  ].join(' '),
  success: [
    'bg-[var(--color-success-subtle)] text-[var(--color-success)]',
    'border border-[var(--color-success)]/30',
    'hover:bg-[var(--color-success)] hover:text-white',
  ].join(' '),
}

const sizeStyles: Record<Size, string> = {
  sm:   'h-8 px-3 text-sm gap-1.5',
  md:   'h-10 px-4 text-sm gap-2',
  lg:   'h-11 px-6 text-base gap-2',
  icon: 'h-9 w-9 p-0',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          // Base
          'inline-flex items-center justify-center font-medium rounded-[var(--radius-md)]',
          'transition-all duration-150 cursor-pointer',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          'select-none whitespace-nowrap',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Cargando...</span>
          </>
        ) : children}
      </button>
    )
  }
)

Button.displayName = 'Button'
