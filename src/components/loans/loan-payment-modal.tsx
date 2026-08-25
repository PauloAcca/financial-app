'use client'

import { useState, useEffect, useTransition } from 'react'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import { recordLoanPayment } from '@/actions/loans'
import { formatCurrency, toISODate } from '@/lib/utils'
import type { Loan, Account } from '@/types/database'

interface LoanPaymentModalProps {
  open: boolean
  onClose: () => void
  loan: Loan | null
  accounts?: Account[]
  onSuccess?: () => void
}

export function LoanPaymentModal({
  open,
  onClose,
  loan,
  accounts = [],
  onSuccess,
}: LoanPaymentModalProps) {
  const [isPending, startTransition] = useTransition()
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(toISODate(new Date()))
  const [notes, setNotes] = useState('')
  const [accountId, setAccountId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const isLent = loan?.type === 'lent'
  const totalAmount = Number(loan?.amount) || 0
  const paidAmount = Number(loan?.paid_amount) || 0
  const remainingAmount = Math.max(0, totalAmount - paidAmount)

  useEffect(() => {
    if (loan && open) {
      setAmount(remainingAmount > 0 ? remainingAmount.toString() : '')
      setDate(toISODate(new Date()))
      setNotes('')
      setAccountId(loan.account_id || '')
      setError(null)
    }
  }, [loan, open, remainingAmount])

  if (!loan) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!loan) return

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Ingresá un monto válido mayor a cero.')
      return
    }

    const loanId = loan.id
    const isLentLoan = isLent

    startTransition(async () => {
      const res = await recordLoanPayment({
        loan_id: loanId,
        amount: numAmount,
        paid_at: date,
        notes: notes || undefined,
        account_id: accountId || undefined,
      })

      if (res.success) {
        toast.success(
          isLentLoan
            ? '¡Cobro / devolución registrada con éxito!'
            : '¡Pago / devolución registrada con éxito!'
        )
        onClose()
        onSuccess?.()
      } else {
        setError(res.error)
      }
    })
  }

  const activeAccounts = accounts.filter((a) => !a.archived)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isLent ? '💰 Registrar Cobro / Devolución' : '⚔️ Registrar Pago / Devolución'}
      description={`Registrá el dinero devuelto de "${loan.person_name}".`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-mono">
        {error && (
          <div className="px-4 py-3 rounded-[4px] bg-[#ff4d6d]/15 border border-[#ff4d6d]/30 text-xs text-[#ff4d6d]">
            {error}
          </div>
        )}

        {/* Resumen de Estado Actual */}
        <div className="bg-[#14182b] border border-[#293056] rounded-[4px] p-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[#8B92A9] uppercase">RESTANTE POR LIQUIDAR</p>
            <p className="text-lg font-bold text-white tabular-nums">
              {formatCurrency(remainingAmount, loan.currency)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#8B92A9] uppercase">YA DEVUELTO</p>
            <p className="text-sm font-bold text-[#00FF66] tabular-nums">
              {formatCurrency(paidAmount, loan.currency)}
            </p>
          </div>
        </div>

        {/* Monto a registrar */}
        <div>
          <Input
            id="payment-amount"
            label="Monto a registrar"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          {remainingAmount > 0 && parseFloat(amount) !== remainingAmount && (
            <button
              type="button"
              onClick={() => setAmount(remainingAmount.toString())}
              className="mt-1.5 text-[11px] text-[#00FF66] hover:underline font-bold tracking-wider cursor-pointer"
            >
              Liquidar total restante ({formatCurrency(remainingAmount, loan.currency)})
            </button>
          )}
        </div>

        {/* Fecha */}
        <Input
          id="payment-date"
          label="Fecha de la devolución"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        {/* Cuenta de destino o de donde sale (opcional) */}
        {activeAccounts.length > 0 && (
          <Select
            id="payment-account"
            label={isLent ? 'Cuenta donde ingresó el dinero (Opcional)' : 'Cuenta desde donde pagaste (Opcional)'}
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            options={[
              { value: '', label: 'Solo registro informativo' },
              ...activeAccounts.map((a) => ({ value: a.id, label: `${a.name} (${a.currency})` })),
            ]}
          />
        )}

        {/* Notas */}
        <Input
          id="payment-notes"
          label="Notas del pago (Opcional)"
          placeholder='Ej: "Transferencia bancaria", "Efectivo entregado"'
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex justify-end gap-2.5 pt-3 border-t border-[#293056]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-[4px] bg-[#181c31] border border-[#293056] text-[#8B92A9] text-xs font-bold uppercase hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 rounded-[4px] bg-[#00FF66] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#00cc52] transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
          >
            {isPending ? 'Registrando...' : 'Confirmar Devolución'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
