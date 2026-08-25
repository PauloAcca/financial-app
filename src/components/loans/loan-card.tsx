'use client'

import { HandCoins, ArrowUpRight, ArrowDownLeft, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
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
        'group bg-[#181c31] border rounded-[6px] p-4 font-mono transition-all duration-200 cursor-pointer select-none relative shadow-sm',
        'hover:shadow-[0_0_15px_rgba(0,255,102,0.15)] hover:translate-y-[-2px] active:scale-[0.99]',
        isPaid
          ? 'border-[#293056] opacity-75'
          : isLent
          ? 'border-[#00FF66]/40 hover:border-[#00FF66]'
          : 'border-[#ff4d6d]/40 hover:border-[#ff4d6d]'
      )}
    >
      {/* 1. Cabecera: Persona, Tipo y Estado */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              'w-10 h-10 rounded-[4px] flex items-center justify-center shrink-0 border',
              isLent
                ? 'bg-[#00FF66]/10 border-[#00FF66]/30 text-[#00FF66]'
                : 'bg-[#ff4d6d]/10 border-[#ff4d6d]/30 text-[#ff4d6d]'
            )}
          >
            {isLent ? <ArrowUpRight size={20} className="stroke-[2.5]" /> : <ArrowDownLeft size={20} className="stroke-[2.5]" />}
          </div>

          <div className="min-w-0">
            <h3 className="font-bold text-white text-sm sm:text-base tracking-wide truncate group-hover:text-[#00FF66] transition-colors">
              {loan.person_name}
            </h3>
            <span
              className={cn(
                'text-[10px] font-bold tracking-wider uppercase',
                isLent ? 'text-[#00FF66]' : 'text-[#ff4d6d]'
              )}
            >
              {isLent ? '🟢 LE PRESTÉ (ME DEBE)' : '🔴 ME PRESTÓ (DEBO)'}
            </span>
          </div>
        </div>

        {/* Badge de Estado */}
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

      {/* 2. Montos: Restante y Total */}
      <div className="bg-[#14182b] border border-[#293056] rounded-[4px] p-3 mb-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] text-[#8B92A9] uppercase tracking-wider">
              {isPaid ? 'MONTO TOTAL SALDADO' : 'MONTO RESTANTE'}
            </p>
            <p
              className={cn(
                'text-lg sm:text-xl font-bold tabular-nums tracking-tight',
                isPaid ? 'text-white' : isLent ? 'text-[#00FF66] glow-text-green' : 'text-[#ff4d6d] glow-text-pink'
              )}
            >
              {formatCurrency(isPaid ? totalAmount : remainingAmount, loan.currency)}
            </p>
          </div>

          {!isPaid && (
            <div className="text-right">
              <p className="text-[10px] text-[#5d6786] uppercase">TOTAL INICIAL</p>
              <p className="text-xs font-bold text-[#8B92A9] tabular-nums">
                {formatCurrency(totalAmount, loan.currency)}
              </p>
            </div>
          )}
        </div>

        {/* Barra de progreso si hay pagos parciales */}
        {!isPaid && paidAmount > 0 && (
          <div className="mt-2 pt-2 border-t border-[#20253f]">
            <div className="flex justify-between text-[10px] text-[#8B92A9] mb-1">
              <span>DEVUELTO: {formatCurrency(paidAmount, loan.currency)}</span>
              <span>{progressPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#20253f] rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-300',
                  isLent ? 'bg-[#00FF66]' : 'bg-[#ff4d6d]'
                )}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Footer: Fecha límite y botón de acción */}
      <div className="flex items-center justify-between text-xs pt-1">
        <div className="flex items-center gap-1.5 text-[#8B92A9] text-[11px]">
          <Calendar size={13} className="text-[#5d6786]" />
          <span>
            {loan.due_date
              ? `Límite: ${formatDate(loan.due_date, 'short')}`
              : `Creado: ${formatDate(loan.created_at, 'short')}`}
          </span>
        </div>

        {!isPaid ? (
          <button
            onClick={handlePaymentClick}
            className={cn(
              'px-2.5 py-1 rounded-[4px] text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95 border',
              isLent
                ? 'bg-[#00FF66] text-black border-[#00FF66] hover:bg-[#00cc52]'
                : 'bg-[#ff4d6d] text-white border-[#ff4d6d] hover:bg-[#e03a58]'
            )}
          >
            {isLent ? 'REGISTRAR COBRO' : 'REGISTRAR PAGO'}
          </button>
        ) : (
          <span className="text-[10px] font-bold text-[#5d6786] uppercase">
            TOCÁ PARA VER DETALLES ➔
          </span>
        )}
      </div>
    </div>
  )
}
