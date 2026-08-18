import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export function Card({ children, className, hover, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-[var(--color-surface)] border border-[var(--color-border)]',
        'rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)]',
        hover && 'transition-all duration-200 hover:border-[var(--color-accent)]/40 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-5 pt-5 pb-0', className)}>
      {children}
    </div>
  )
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-5 py-4', className)}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-5 pb-5 pt-0 flex items-center gap-2', className)}>
      {children}
    </div>
  )
}
