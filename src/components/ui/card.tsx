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
        'glass rounded-[var(--radius-lg)]',
        hover &&
          'transition-all duration-300 hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(3,6,10,0.45)]',
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
