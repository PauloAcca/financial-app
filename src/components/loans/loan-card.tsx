'use client'

import { ArrowUpRight, ArrowDownLeft, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Loan } from '@/types/database'

interface LoanCardProps {
  loan: Loan
  onSelect: (loan: Loan) => void
  onPayment: (loan: Loan) => void
}

export function LoanCard({ loan, onSelect, onPayment }: LoanCardProps) {
  const isLent = loan.type === 'lent'
  const totalAmount = Number(loan.amount) || 0
  const paidAmount = Number(loan.paid_amount) || 0
  const remainingAmount = Math.max(0, totalAmount - paidAmount)
  const progressPct = Math.min(100, Math.round((paidAmount / totalAmount) * 100))

  const isPaid = loan.status === 'paid' || remainingAmount === 0
  const isPartial = loan.status === 'partial' || (paidAmount > 0 && !isPaid)

  // Calcular si está vencido
  const isOverdue = loan.due_date && !isPaid && new Date(loan.due_date) < new Date()

  function handlePaymentClick(e: React.MouseEvent) {
    e.stopPropagation()
    onPayment(loan)
  }

  return (
    <div
      onClick={() => onSelect(loan)}
      className={cn(
        'group glass rounded-[var(--radius-lg)] p-4 transition-all duration-200 cursor-pointer select-none relative',
        'hover:bg-[rgba(255,255,255,0.07)] hover:border-[rgba(255,255,255,0.15)] hover:-translate-y-0.5 active:scale-[0.99]',
        isPaid && 'opacity-75'
      )}
    >
      {/* 1. Cabecera: Persona, Tipo y Estado */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              'w-10 h-10 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0 border border-[rgba(255,255,255,0.07)]',
              isLent
                ? 'bg-[var(--color-income-subtle)] text-[var(--color-income)]'
                : 'bg-[var(--color-expense-subtle)] text-[var(--color-expense)]'
            )}
          >
            {isLent ? <ArrowUpRight size={20} className="stroke-[2.5]" /> : <ArrowDownLeft size={20} className="stroke-[2.5]" />}
          </div>

          <div className="min-w-0">
            <h3 className="font-medium text-[var(--color-text-primary)] text-sm sm:text-base truncate group-hover:text-[var(--color-accent)] transition-colors">
              {loan.person_name}
            </h3>
            <div className="mt-1">
              <Badge variant={isLent ? 'income' : 'expense'}>
                {isLent ? 'Le presté' : 'Me prestaron'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Badge de Estado */}
        <div>
          {isPaid ? (
            <Badge variant="income">
              <CheckCircle2 size={11} />
              <span>Saldado</span>
            </Badge>
          ) : isPartial ? (
            <Badge variant="transfer">
              <Clock size={11} />
              <span>Parcial</span>
            </Badge>
          ) : isOverdue ? (
            <Badge variant="expense">
              <AlertCircle size={11} />
              <span>Vencido</span>
            </Badge>
          ) : (
            <Badge variant="muted">Pendiente</Badge>
          )}
        </div>
      </div>

      {/* 2. Montos: Restante y Total */}
      <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-[var(--radius-md)] p-3 mb-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">
              {isPaid ? 'Monto total saldado' : 'Monto restante'}
            </p>
            <p
              className={cn(
                'text-lg sm:text-xl font-semibold tabular-nums tracking-tight mt-0.5',
                isPaid
                  ? 'text-[var(--color-text-primary)]'
                  : isLent
                  ? 'text-[var(--color-income)]'
                  : 'text-[var(--color-expense)]'
              )}
            >
              {formatCurrency(isPaid ? totalAmount : remainingAmount, loan.currency)}
            </p>
          </div>

          {!isPaid && (
            <div className="text-right">
              <p className="text-xs text-[var(--color-text-muted)]">Total inicial</p>
              <p className="text-xs font-medium text-[var(--color-text-secondary)] tabular-nums">
                {formatCurrency(totalAmount, loan.currency)}
              </p>
            </div>
          )}
        </div>

        {/* Barra de progreso si hay pagos parciales */}
        {!isPaid && paidAmount > 0 && (
          <div className="mt-2 pt-2 border-t border-[rgba(255,255,255,0.06)]">
            <div className="flex justify-between text-[0.6875rem] text-[var(--color-text-secondary)] mb-1.5">
              <span className="tabular-nums">Devuelto: {formatCurrency(paidAmount, loan.currency)}</span>
              <span className="tabular-nums">{progressPct}%</span>
            </div>
            <div className="w-full h-1.5 rounded-[var(--radius-full)] bg-[rgba(255,255,255,0.06)] overflow-hidden">
              <div
                className="h-full rounded-[var(--radius-full)] bg-[var(--color-accent)] transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Footer: Fecha límite y botón de acción */}
      <div className="flex items-center justify-between text-xs pt-1">
        <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)] text-[11px]">
          <Calendar size={13} className="text-[var(--color-text-muted)]" />
          <span>
            {loan.due_date
              ? `Límite: ${formatDate(loan.due_date, 'short')}`
              : `Creado: ${formatDate(loan.created_at, 'short')}`}
          </span>
        </div>

        {!isPaid ? (
          <Button
            variant={isLent ? 'primary' : 'danger'}
            size="sm"
            onClick={handlePaymentClick}
          >
            {isLent ? 'Registrar cobro' : 'Registrar pago'}
          </Button>
        ) : (
          <span className="text-[11px] text-[var(--color-text-muted)]">
            Tocá para ver detalles
          </span>
        )}
      </div>
    </div>
  )
}
