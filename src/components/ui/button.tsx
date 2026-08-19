'use client'

import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'arcade-green' | 'arcade-pink'
type Size = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variantStyles: Record<Variant, string> = {
  primary: [
    'bg-[#00FF66] text-black font-bold',
    'hover:bg-[#00e65c]',
    'border-b-2 border-[#00b347]',
    'shadow-[0_0_12px_rgba(0,255,102,0.3)]',
    'hover:shadow-[0_0_18px_rgba(0,255,102,0.5)]',
  ].join(' '),
  'arcade-green': 'btn-arcade-green',
  'arcade-pink': 'btn-arcade-pink',
  secondary: [
    'bg-[#20253f] text-white font-medium',
    'border border-[#293056]',
    'hover:bg-[#252b49] hover:border-[#00FF66]',
  ].join(' '),
  ghost: [
    'bg-transparent text-[#8B92A9]',
    'hover:bg-[#20253f] hover:text-white',
  ].join(' '),
  danger: [
    'bg-[#ff4d6d] text-black font-bold',
    'border-b-2 border-[#cc143d]',
    'shadow-[0_0_12px_rgba(255,77,109,0.3)]',
    'hover:bg-[#ff335c]',
  ].join(' '),
  success: [
    'bg-[#00FF66] text-black font-bold',
    'border-b-2 border-[#00b347]',
    'hover:bg-[#00e65c]',
  ].join(' '),
}

const sizeStyles: Record<Size, string> = {
  sm:   'h-8 px-3 text-xs gap-1.5',
  md:   'h-10 px-4 text-xs gap-2',
  lg:   'h-11 px-6 text-sm gap-2',
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
          'inline-flex items-center justify-center font-mono uppercase tracking-wider rounded-[4px]',
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
            <span>CARGANDO...</span>
          </>
        ) : children}
      </button>
    )
  }
)

Button.displayName = 'Button'
