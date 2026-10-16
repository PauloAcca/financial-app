'use client'

import { useState, useTransition } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Pencil,
  Trash2,
  Plus,
  ReceiptText,
  RotateCcw,
  Wallet,
} from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { toggleLoanStatus, deleteLoan } from '@/actions/loans'
import { toast } from '@/components/ui/toast'
import type { Loan } from '@/types/database'

interface LoanDetailModalProps {
  open: boolean
  onClose: () => void
  loan: Loan | null
  onEdit: (loan: Loan) => void
  onPayment: (loan: Loan) => void
  onDeleted?: () => void
}

export function LoanDetailModal({
  open,
  onClose,
  loan,
  onEdit,
  onPayment,
  onDeleted,
}: LoanDetailModalProps) {
  const [isPending, startTransition] = useTransition()

  if (!loan) return null

  const isLent = loan.type === 'lent'
  const totalAmount = Number(loan.amount) || 0
  const paidAmount = Number(loan.paid_amount) || 0
  const remainingAmount = Math.max(0, totalAmount - paidAmount)
  const progressPct = Math.min(100, Math.round((paidAmount / totalAmount) * 100))

  const isPaid = loan.status === 'paid' || remainingAmount === 0
  const isPartial = loan.status === 'partial' || (paidAmount > 0 && !isPaid)
  const isOverdue = loan.due_date && !isPaid && new Date(loan.due_date) < new Date()

  function handleToggleStatus() {
    if (!loan) return
    const nextStatus = isPaid ? 'pending' : 'paid'

    startTransition(async () => {
      const res = await toggleLoanStatus(loan.id, nextStatus)
      if (res.success) {
        toast.success(isPaid ? 'Préstamo reabierto como pendiente.' : 'Préstamo marcado como saldado.')
        onClose()
      } else {
        toast.error(res.error)
      }
    })
  }

  function handleDelete() {
    if (!loan) return
    if (!confirm(`¿Estás seguro de que querés eliminar el préstamo con "${loan.person_name}"?`)) return

    startTransition(async () => {
      const res = await deleteLoan(loan.id)
      if (res.success) {
        toast.success('Préstamo eliminado.')
        onClose()
        onDeleted?.()
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detalle del préstamo"
      size="md"
    >
      <div className="flex flex-col gap-4">
        {/* 1. Header con Persona, Tipo y Estado */}
        <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-[var(--radius-md)] p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-11 h-11 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0 border border-[rgba(255,255,255,0.07)]',
                  isLent
                    ? 'bg-[var(--color-income-subtle)] text-[var(--color-income)]'
                    : 'bg-[var(--color-expense-subtle)] text-[var(--color-expense)]'
                )}
              >
                {isLent ? <ArrowUpRight size={24} className="stroke-[2.5]" /> : <ArrowDownLeft size={24} className="stroke-[2.5]" />}
              </div>

              <div>
                <h3 className="font-semibold text-[var(--color-text-primary)] text-base sm:text-lg">
                  {loan.person_name}
                </h3>
                <div className="mt-1">
                  <Badge variant={isLent ? 'income' : 'expense'}>
                    {isLent ? 'Le presté' : 'Me prestaron'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Badge */}
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

          {/* Montos */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[rgba(255,255,255,0.06)]">
            <div>
              <p className="text-xs font-medium text-[var(--color-text-secondary)]">Monto inicial</p>
              <p className="text-sm sm:text-base font-semibold text-[var(--color-text-primary)] tabular-nums">
                {formatCurrency(totalAmount, loan.currency)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                {isPaid ? 'Total saldado' : 'Restante por devolver'}
              </p>
              <p
                className={cn(
                  'text-sm sm:text-base font-semibold tabular-nums',
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
          </div>

          {/* Barra de progreso */}
          <div className="mt-3 pt-2 border-t border-[rgba(255,255,255,0.06)]">
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
        </div>

        {/* 2. Detalles Complementarios */}
        <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-[var(--radius-md)] p-3 text-xs space-y-2">
          {loan.description && (
            <div>
              <span className="text-[var(--color-text-secondary)] text-[0.6875rem] font-medium block mb-1">
                Concepto / notas
              </span>
              <p className="text-[var(--color-text-primary)] bg-[rgba(255,255,255,0.04)] p-2 rounded-[var(--radius-sm)] border border-[rgba(255,255,255,0.06)]">
                {loan.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[var(--color-text-secondary)] text-[0.6875rem] font-medium block">
                Fecha de registro
              </span>
              <span className="text-[var(--color-text-primary)]">{formatDate(loan.created_at, 'long')}</span>
            </div>

            <div>
              <span className="text-[var(--color-text-secondary)] text-[0.6875rem] font-medium block">
                Fecha límite
              </span>
              <span
                className={cn(
                  'font-medium',
                  isOverdue ? 'text-[var(--color-expense)]' : 'text-[var(--color-text-primary)]'
                )}
              >
                {loan.due_date ? formatDate(loan.due_date, 'long') : 'Sin fecha límite'}
              </span>
            </div>
          </div>

          {loan.account && (
            <div className="pt-2 border-t border-[rgba(255,255,255,0.06)] flex items-center gap-2">
              <Wallet size={14} className="text-[var(--color-transfer)]" />
              <span className="text-[var(--color-text-secondary)]">Cuenta de referencia:</span>
              <span className="text-[var(--color-text-primary)] font-medium">{loan.account.name}</span>
            </div>
          )}
        </div>

        {/* 3. Historial de Pagos / Devoluciones */}
        {loan.payments && loan.payments.length > 0 && (
          <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-[var(--radius-md)] p-3">
            <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2 flex items-center gap-1.5">
              <ReceiptText size={14} />
              <span>Historial de devoluciones ({loan.payments.length})</span>
            </p>

            <div className="divide-y divide-[rgba(255,255,255,0.06)] max-h-40 overflow-y-auto">
              {loan.payments.map((p) => (
                <div key={p.id} className="py-2 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-[var(--color-income)] tabular-nums">
                      +{formatCurrency(p.amount, loan.currency)}
                    </p>
                    <p className="text-[0.6875rem] text-[var(--color-text-secondary)]">
                      {formatDate(p.paid_at, 'short')} {p.notes && `• ${p.notes}`}
                    </p>
                  </div>
                  {p.account && (
                    <span className="text-[0.6875rem] px-1.5 py-0.5 bg-[rgba(255,255,255,0.06)] text-[var(--color-transfer)] rounded-[var(--radius-sm)]">
                      {p.account.name}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Botones de Acción */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[rgba(255,255,255,0.07)]">
          {!isPaid ? (
            <Button
              variant="primary"
              size="sm"
              className="flex-1 h-9"
              onClick={() => {
                onClose()
                onPayment(loan)
              }}
            >
              <Plus size={15} />
              <span>Registrar cobro / pago</span>
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 h-9"
              onClick={handleToggleStatus}
              disabled={isPending}
            >
              <RotateCcw size={14} />
              <span>Reabrir préstamo</span>
            </Button>
          )}

          {!isPaid && (
            <Button
              variant="success"
              size="sm"
              className="h-9"
              onClick={handleToggleStatus}
              disabled={isPending}
              title="Marcar como totalmente saldado"
            >
              <CheckCircle2 size={14} />
              <span>Marcar saldado</span>
            </Button>
          )}

          <Button
            variant="glass"
            size="icon"
            onClick={() => {
              onClose()
              onEdit(loan)
            }}
            title="Editar préstamo"
          >
            <Pencil size={15} />
          </Button>

          <Button
            variant="danger"
            size="icon"
            onClick={handleDelete}
            disabled={isPending}
            title="Eliminar préstamo"
          >
            <Trash2 size={15} />
          </Button>
        </div>
      </div>
    </Modal>
  )
}
