'use client'

import { useState, useTransition } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import { createTransaction } from '@/actions/transactions'
import { cn, toISODate } from '@/lib/utils'
import type { InvestmentPlatform } from '@/lib/investments'
import type { Account } from '@/types/database'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'

interface InvestmentContributionModalProps {
  open: boolean
  onClose: () => void
  platform: InvestmentPlatform | null
  accounts: Account[]
  onSuccess?: () => void
}

export function InvestmentContributionModal({
  open,
  onClose,
  platform,
  accounts,
  onSuccess,
}: InvestmentContributionModalProps) {
  const [isPending, startTransition] = useTransition()
  const [direction, setDirection] = useState<'in' | 'out'>('in')
  const [counterAccountId, setCounterAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(() => toISODate(new Date()))
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!platform) return null

  const currency = platform.account.currency
  const counterAccounts = accounts.filter((a) => a.id !== platform.account.id && !a.archived)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!platform) return

    const numAmount = parseFloat(amount)
    if (!counterAccountId) {
      setError(direction === 'in' ? 'Elegí la cuenta de donde sale el dinero.' : 'Elegí la cuenta donde entra el dinero.')
      return
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Ingresá un monto válido mayor a cero.')
      return
    }

    const investmentId = platform.account.id
    const isContribution = direction === 'in'

    startTransition(async () => {
      const res = await createTransaction({
        type: 'transfer',
        amount: numAmount,
        currency,
        account_id: isContribution ? counterAccountId : investmentId,
        transfer_account_id: isContribution ? investmentId : counterAccountId,
        occurred_at: date,
        description: description.trim() || (isContribution ? 'Aporte a inversión' : 'Retiro de inversión'),
      })

      if (res.success) {
        toast.success(isContribution ? 'Aporte registrado.' : 'Retiro registrado.')
        onClose()
        onSuccess?.()
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={direction === 'in' ? 'Registrar aporte' : 'Registrar retiro'}
      description={`Movimiento de dinero en "${platform.account.name}"`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
        {error && (
          <div className="px-4 py-3 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] border border-[rgba(227,160,170,0.35)] text-xs text-[var(--color-danger)]">
            {error}
          </div>
        )}

        {/* Dirección */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDirection('in')}
            className={cn(
              'py-2.5 px-3 rounded-[var(--radius-md)] text-xs font-medium flex items-center justify-center gap-1.5 border transition-all cursor-pointer',
              direction === 'in'
                ? 'bg-[var(--color-income-subtle)] text-[var(--color-income)] border-[rgba(127,217,164,0.45)]'
                : 'bg-[rgba(255,255,255,0.04)] text-[var(--color-text-secondary)] border-[rgba(255,255,255,0.08)] hover:text-[var(--color-text-primary)] hover:border-[rgba(255,255,255,0.14)]'
            )}
          >
            <ArrowDownLeft size={16} className="stroke-[2.5]" />
            <span>Aportar</span>
          </button>
          <button
            type="button"
            onClick={() => setDirection('out')}
            className={cn(
              'py-2.5 px-3 rounded-[var(--radius-md)] text-xs font-medium flex items-center justify-center gap-1.5 border transition-all cursor-pointer',
              direction === 'out'
                ? 'bg-[var(--color-expense-subtle)] text-[var(--color-expense)] border-[rgba(227,160,170,0.45)]'
                : 'bg-[rgba(255,255,255,0.04)] text-[var(--color-text-secondary)] border-[rgba(255,255,255,0.08)] hover:text-[var(--color-text-primary)] hover:border-[rgba(255,255,255,0.14)]'
            )}
          >
            <ArrowUpRight size={16} className="stroke-[2.5]" />
            <span>Retirar</span>
          </button>
        </div>

        <Input
          id="contribution-amount"
          label="Monto"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          helper={`En ${currency}`}
          required
        />

        <Select
          id="contribution-account"
          label={direction === 'in' ? 'Cuenta de origen' : 'Cuenta de destino'}
          value={counterAccountId}
          onChange={(e) => setCounterAccountId(e.target.value)}
          options={[
            { value: '', label: 'Seleccionar...' },
            ...counterAccounts.map((a) => ({ value: a.id, label: `${a.name} (${a.currency})` })),
          ]}
        />

        <Input
          id="contribution-date"
          label="Fecha"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <Input
          id="contribution-desc"
          label="Descripción (opcional)"
          placeholder='Ej: "Aporte mensual", "Rescate parcial"'
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex justify-end gap-2.5 pt-3 border-t border-[rgba(255,255,255,0.06)]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant={direction === 'in' ? 'success' : 'danger'}
            disabled={isPending}
          >
            {isPending ? 'Registrando…' : direction === 'in' ? 'Registrar aporte' : 'Registrar retiro'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
