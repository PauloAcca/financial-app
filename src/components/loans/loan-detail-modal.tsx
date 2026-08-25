'use client'

import { useState, useTransition } from 'react'
import { Modal } from '@/components/ui/modal'
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
        toast.success(isPaid ? 'Préstamo reabierto como pendiente.' : '¡Préstamo marcado como saldado!')
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
      title="📋 Detalle del Préstamo"
      size="md"
    >
      <div className="flex flex-col gap-4 font-mono">
        {/* 1. Header con Persona, Tipo y Estado */}
        <div className="bg-[#14182b] border border-[#293056] rounded-[4px] p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-11 h-11 rounded-[4px] flex items-center justify-center shrink-0 border',
                  isLent
                    ? 'bg-[#00FF66]/15 border-[#00FF66]/40 text-[#00FF66]'
                    : 'bg-[#ff4d6d]/15 border-[#ff4d6d]/40 text-[#ff4d6d]'
                )}
              >
                {isLent ? <ArrowUpRight size={24} className="stroke-[2.5]" /> : <ArrowDownLeft size={24} className="stroke-[2.5]" />}
              </div>

              <div>
                <h3 className="font-bold text-white text-base sm:text-lg tracking-wide">
                  {loan.person_name}
                </h3>
                <p
                  className={cn(
                    'text-xs font-bold uppercase tracking-wider',
                    isLent ? 'text-[#00FF66]' : 'text-[#ff4d6d]'
                  )}
                >
                  {isLent ? '🟢 LE PRESTÉ (ME DEBE)' : '🔴 ME PRESTÓ (DEBO)'}
                </p>
              </div>
            </div>

            {/* Badge */}
            <div>
              {isPaid ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-[2px] bg-[#00FF66]/15 border border-[#00FF66]/40 text-[#00FF66] uppercase flex items-center gap-1">
                  <CheckCircle2 size={11} />
                  <span>SALDADO</span>
                </span>
              ) : isPartial ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-[2px] bg-[#38d9f5]/15 border border-[#38d9f5]/40 text-[#38d9f5] uppercase flex items-center gap-1">
                  <Clock size={11} />
                  <span>PARCIAL</span>
                </span>
              ) : isOverdue ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-[2px] bg-[#ff4d6d]/15 border border-[#ff4d6d]/40 text-[#ff4d6d] uppercase flex items-center gap-1">
                  <AlertCircle size={11} />
                  <span>VENCIDO</span>
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-[2px] bg-[#293056] text-[#8B92A9] uppercase">
                  PENDIENTE
                </span>
              )}
            </div>
          </div>

          {/* Montos */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#20253f]">
            <div>
              <p className="text-[10px] text-[#8B92A9] uppercase">MONTO INICIAL</p>
              <p className="text-sm sm:text-base font-bold text-white tabular-nums">
                {formatCurrency(totalAmount, loan.currency)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[#8B92A9] uppercase">
                {isPaid ? 'TOTAL SALDADO' : 'RESTANTE POR DEVOLVER'}
              </p>
              <p
                className={cn(
                  'text-sm sm:text-base font-bold tabular-nums',
                  isPaid ? 'text-white' : isLent ? 'text-[#00FF66]' : 'text-[#ff4d6d]'
                )}
              >
                {formatCurrency(isPaid ? totalAmount : remainingAmount, loan.currency)}
              </p>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="mt-3 pt-2 border-t border-[#20253f]">
            <div className="flex justify-between text-[10px] text-[#8B92A9] mb-1">
              <span>DEVUELTO: {formatCurrency(paidAmount, loan.currency)}</span>
              <span>{progressPct}%</span>
            </div>
            <div className="w-full h-2 bg-[#20253f] rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-300',
                  isLent ? 'bg-[#00FF66]' : 'bg-[#ff4d6d]'
                )}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2. Detalles Complementarios */}
        <div className="bg-[#14182b] border border-[#293056] rounded-[4px] p-3 text-xs space-y-2">
          {loan.description && (
            <div>
              <span className="text-[#8B92A9] text-[10px] uppercase font-bold block mb-0.5">
                CONCEPTO / NOTAS:
              </span>
              <p className="text-white bg-[#0f111e] p-2 rounded-[2px] border border-[#20253f]">
                {loan.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-[#8B92A9] text-[10px] uppercase font-bold block">
                FECHA DE REGISTRO:
              </span>
              <span className="text-white">{formatDate(loan.created_at, 'long')}</span>
            </div>

            <div>
              <span className="text-[#8B92A9] text-[10px] uppercase font-bold block">
                FECHA LÍMITE:
              </span>
              <span className={cn('font-bold', isOverdue ? 'text-[#ff4d6d]' : 'text-white')}>
                {loan.due_date ? formatDate(loan.due_date, 'long') : 'Sin fecha límite'}
              </span>
            </div>
          </div>

          {loan.account && (
            <div className="pt-2 border-t border-[#20253f] flex items-center gap-2">
              <Wallet size={14} className="text-[#38d9f5]" />
              <span className="text-[#8B92A9]">Cuenta de referencia:</span>
              <span className="text-white font-bold">{loan.account.name}</span>
            </div>
          )}
        </div>

        {/* 3. Historial de Pagos / Devoluciones */}
        {loan.payments && loan.payments.length > 0 && (
          <div className="bg-[#14182b] border border-[#293056] rounded-[4px] p-3">
            <p className="text-[10px] font-bold text-[#8B92A9] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ReceiptText size={14} />
              <span>HISTORIAL DE DEVOLUCIONES ({loan.payments.length})</span>
            </p>

            <div className="divide-y divide-[#20253f] max-h-40 overflow-y-auto">
              {loan.payments.map((p) => (
                <div key={p.id} className="py-2 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-white">
                      +{formatCurrency(p.amount, loan.currency)}
                    </p>
                    <p className="text-[10px] text-[#8B92A9]">
                      {formatDate(p.paid_at, 'short')} {p.notes && `• ${p.notes}`}
                    </p>
                  </div>
                  {p.account && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-[#20253f] text-[#38d9f5] rounded">
                      {p.account.name}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Botones de Acción */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#293056]">
          {!isPaid ? (
            <button
              onClick={() => {
                onClose()
                onPayment(loan)
              }}
              className="btn-arcade-green flex-1 py-2.5 px-3 rounded-[4px] text-xs font-bold text-black flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
            >
              <Plus size={15} />
              <span>REGISTRAR COBRO / PAGO</span>
            </button>
          ) : (
            <button
              onClick={handleToggleStatus}
              disabled={isPending}
              className="py-2.5 px-3 rounded-[4px] bg-[#181c31] border border-[#293056] text-[#8B92A9] text-xs font-bold uppercase hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <RotateCcw size={14} />
              <span>REABRIR PRÉSTAMO</span>
            </button>
          )}

          {!isPaid && (
            <button
              onClick={handleToggleStatus}
              disabled={isPending}
              className="py-2.5 px-3 rounded-[4px] bg-[#181c31] border border-[#00FF66]/40 text-[#00FF66] text-xs font-bold uppercase hover:bg-[#00FF66]/10 transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95"
              title="Marcar como totalmente saldado"
            >
              <CheckCircle2 size={14} />
              <span>MARCAR SALDADO</span>
            </button>
          )}

          <button
            onClick={() => {
              onClose()
              onEdit(loan)
            }}
            className="p-2.5 rounded-[4px] bg-[#181c31] border border-[#293056] text-white hover:border-[#00FF66] hover:text-[#00FF66] transition-colors cursor-pointer"
            title="Editar préstamo"
          >
            <Pencil size={15} />
          </button>

          <button
            onClick={handleDelete}
            disabled={isPending}
            className="p-2.5 rounded-[4px] bg-[#181c31] border border-[#ff4d6d]/40 text-[#ff4d6d] hover:bg-[#ff4d6d]/10 transition-colors cursor-pointer"
            title="Eliminar préstamo"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </Modal>
  )
}
